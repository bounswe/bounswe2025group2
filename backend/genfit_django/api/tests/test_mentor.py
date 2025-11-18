from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status

from ..models import MentorMenteeRelationship, Notification

User = get_user_model()


class MentorRelationshipTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create users
        self.coach = User.objects.create_user(
            username='coach1', email='coach1@example.com', password='pass123', user_type='Coach'
        )
        self.user = User.objects.create_user(
            username='user1', email='user1@example.com', password='pass123', user_type='User'
        )
        self.other_user = User.objects.create_user(
            username='other', email='other@example.com', password='pass123', user_type='User'
        )

        # URLs
        self.create_url = reverse('create_mentor_relationship')
        self.list_url = reverse('get_user_mentor_relationships')

    def test_create_relationship_by_coach_sends_notification(self):
        self.client.force_login(self.coach)
        payload = {'mentor': self.coach.id, 'mentee': self.user.id}
        response = self.client.post(self.create_url, data=payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()

        rel = MentorMenteeRelationship.objects.get(id=data['id'])
        self.assertEqual(rel.status, 'PENDING')
        self.assertEqual(rel.sender_id, self.coach.id)
        self.assertEqual(rel.receiver_id, self.user.id)

        # Notification to mentee
        notif = Notification.objects.filter(recipient=self.user, notification_type='MENTOR_REQUEST').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.sender_id, self.coach.id)

    def test_create_relationship_by_user_sets_sender_receiver(self):
        self.client.force_login(self.user)
        payload = {'mentor': self.coach.id, 'mentee': self.user.id}
        response = self.client.post(self.create_url, data=payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        rel = MentorMenteeRelationship.objects.get(id=data['id'])
        self.assertEqual(rel.sender_id, self.user.id)
        self.assertEqual(rel.receiver_id, self.coach.id)

    def test_validation_blocks_same_user(self):
        self.client.force_login(self.user)
        payload = {'mentor': self.user.id, 'mentee': self.user.id}
        response = self.client.post(self.create_url, data=payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Mentor and mentee cannot be the same user', str(response.content))

    def test_accept_relationship_only_by_receiver(self):
        # Create request by coach
        self.client.force_login(self.coach)
        resp = self.client.post(self.create_url, data={'mentor': self.coach.id, 'mentee': self.user.id})
        rel_id = resp.json()['id']

        # Attempt accept by non-receiver -> forbidden
        self.client.force_login(self.coach)
        respond_url = reverse('change_mentor_relationship_status', args=[rel_id])
        response = self.client.post(respond_url, data={'status': 'ACCEPTED'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Accept by receiver
        self.client.force_login(self.user)
        response = self.client.post(respond_url, data={'status': 'ACCEPTED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rel = MentorMenteeRelationship.objects.get(id=rel_id)
        self.assertEqual(rel.status, 'ACCEPTED')

        # Notification to sender with SYSTEM type
        notif = Notification.objects.filter(recipient=self.coach, related_object_id=rel_id).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'SYSTEM')

    def test_terminate_relationship_only_mentor_or_mentee(self):
        # Create and accept
        self.client.force_login(self.coach)
        resp = self.client.post(self.create_url, data={'mentor': self.coach.id, 'mentee': self.user.id})
        rel_id = resp.json()['id']
        respond_url = reverse('change_mentor_relationship_status', args=[rel_id])
        self.client.force_login(self.user)
        self.client.post(respond_url, data={'response': 'ACCEPTED'})

        # Terminate by unrelated user -> forbidden
        self.client.force_login(self.other_user)
        term_url = reverse('change_mentor_relationship_status', args=[rel_id])
        response = self.client.post(term_url, data={'status': 'TERMINATED'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Terminate by mentor
        self.client.force_login(self.coach)
        response = self.client.post(term_url, data={'status': 'TERMINATED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rel = MentorMenteeRelationship.objects.get(id=rel_id)
        self.assertEqual(rel.status, 'TERMINATED')

    def test_list_relationships_with_status_filter(self):
        # Create two requests
        self.client.force_login(self.coach)
        r1 = self.client.post(self.create_url, data={'mentor': self.coach.id, 'mentee': self.user.id}).json()
        r2 = self.client.post(self.create_url, data={'mentor': self.coach.id, 'mentee': self.other_user.id}).json()

        # Accept the first
        self.client.force_login(self.user)
        respond_url = reverse('change_mentor_relationship_status', args=[r1['id']])
        self.client.post(respond_url, data={'status': 'ACCEPTED'})

        # List by coach, filter ACCEPTED
        self.client.force_login(self.coach)
        response = self.client.get(self.list_url, {'status': 'ACCEPTED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(all(item['status'] == 'ACCEPTED' for item in data))

    def test_relationship_detail_requires_involved_user(self):
        # Create request
        self.client.force_login(self.coach)
        r = self.client.post(self.create_url, data={'mentor': self.coach.id, 'mentee': self.user.id}).json()
        detail_url = reverse('get_mentor_relationship_detail', args=[r['id']])

        # Uninvolved user cannot view
        self.client.force_login(self.other_user)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Involved user can view
        self.client.force_login(self.coach)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)