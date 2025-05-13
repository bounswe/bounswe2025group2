from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from ..models import UserWithType, MentorMenteeRequest

class MentorMenteeTestCase(APITestCase):

    def setUp(self):
        self.mentor = UserWithType.objects.create_user(username='mentor', email='mentor@example.com',
                                                       password='mentorpass')
        self.mentee = UserWithType.objects.create_user(username='mentee', email='mentee@example.com',
                                                       password='menteepass')

        # Log in as mentor
        self.client.login(username='mentor', password='mentorpass')

    def test_send_mentor_request(self):
        url = reverse('send_by_mentor', args=[self.mentee.id])  # UPDATED
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MentorMenteeRequest.objects.count(), 1)

    def test_send_mentee_request(self):
        self.client.logout()
        self.client.login(username='mentee', password='menteepass')

        url = reverse('send_by_mentee', args=[self.mentor.id])  # UPDATED
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MentorMenteeRequest.objects.count(), 1)

    def test_view_mentor_mentee_requests(self):
        MentorMenteeRequest.objects.create(mentor=self.mentor, mentee=self.mentee, sender=self.mentor, recipient=self.mentee)
        url = reverse('list_requests')  # UPDATED
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_accept_mentor_request(self):
        request_obj = MentorMenteeRequest.objects.create(
            mentor=self.mentor,
            mentee=self.mentee,
            sender=self.mentor,
            recipient=self.mentee,
            status='PENDING'
        )
        self.client.logout()
        self.client.login(username='mentee', password='menteepass')
        url = reverse('respond_request', args=[request_obj.id])  # UPDATED
        response = self.client.post(url, data={'response': 'ACCEPTED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.mentee, self.mentor.mentees.all())

    def test_view_mentors(self):
        self.mentor.mentees.add(self.mentee)
        self.client.logout()
        self.client.login(username='mentee', password='menteepass')
        url = reverse('my_mentors')  # UPDATED
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_view_mentees(self):
        self.mentor.mentees.add(self.mentee)
        url = reverse('my_mentees')  # UPDATED
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
