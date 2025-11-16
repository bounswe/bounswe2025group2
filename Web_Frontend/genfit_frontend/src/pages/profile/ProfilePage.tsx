import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createQueryKey, queryClient } from '../../lib/query/queryClient'
import GFapi from '../../lib/api/GFapi'
import { Layout } from '../../components'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import './profile_page.css'
import { useGoals } from '../../lib'

interface ProfileDetailsResponse {
  username: string
  name: string
  surname: string
  bio: string
  location: string
  birth_date: string
  age: number | string
  created_at: string
  updated_at: string
  preferred_sports: string
}

export default function ProfilePage() {
  const params = useParams();
  const otherUsername = params.username;
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    surname: '',
    bio: '',
    location: '',
    birth_date: '',
    preferred_sports: '',
  })

  const [isGoalDetailOpen, setIsGoalDetailOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<{
    id: number;
    title: string;
    description?: string;
    goal_type: string;
    status: string;
    current_value: number;
    target_value: number;
    unit: string;
    start_date: string;
    target_date: string;
  } | null>(null)

  const handleDeleteSelectedGoal = async () => {
    if (!selectedGoal) return
    if (!confirm('Are you sure you want to delete this goal?')) return
    try {
      await GFapi.delete(`/api/goals/${selectedGoal.id}/`)
      await queryClient.invalidateQueries({ queryKey: createQueryKey('/api/goals/') })
      setIsGoalDetailOpen(false)
      setSelectedGoal(null)
    } catch (e) {
      console.error('Failed to delete goal', e)
      alert('Failed to delete goal. Please try again.')
    }
  }

  const { data: profileDetails } = useQuery<ProfileDetailsResponse>({
    queryKey: createQueryKey(otherUsername ? `/api/profile/other/${otherUsername}/` : '/api/profile/'),
  })

  const { data: profilePicture } = useQuery<string | { image: string }>({
    queryKey: createQueryKey(otherUsername ? `/api/profile/other/picture/${otherUsername}/` : '/api/profile/picture/'),
    queryFn: async () => {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const endpoint = otherUsername ? `/api/profile/other/picture/${otherUsername}/` : '/api/profile/picture/'
      const response = await fetch(new URL(endpoint, base).toString(), {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch profile picture')
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.startsWith('image/')) {
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
      return response.json()
    },
  })

  useEffect(() => {
    if (profileDetails) {
      setEditedProfile({
        name: profileDetails.name || '',
        surname: profileDetails.surname || '',
        bio: profileDetails.bio || '',
        location: profileDetails.location || '',
        birth_date: profileDetails.birth_date || '',
        preferred_sports: profileDetails.preferred_sports || '',
      })
    }
  }, [profileDetails])

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Omit<ProfileDetailsResponse, 'username' | 'age' | 'created_at' | 'updated_at'>) => {
      return GFapi.put('/api/profile/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/profile/') })
      setIsEditing(false)
    },
  })

  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('profile_picture', file)
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const res = await fetch(new URL('/api/profile/picture/upload/', base).toString(), {
        method: 'POST',
        body: form,
        credentials: 'include',
        headers: {
          'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/)?.[1]) || '',
        },
      })
      if (!res.ok) throw new Error('Failed to upload picture')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/profile/picture/') })
    },
  })

  const deletePictureMutation = useMutation({
    mutationFn: async () => {
      return GFapi.delete('/api/profile/picture/delete/')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/profile/picture/') })
    },
  })

  const onSave = () => {
    updateProfileMutation.mutate({
      name: editedProfile.name,
      surname: editedProfile.surname,
      bio: editedProfile.bio,
      location: editedProfile.location,
      birth_date: editedProfile.birth_date,
      preferred_sports: editedProfile.preferred_sports,
    })
  }

  const { data: goals = [] } = useGoals(otherUsername || undefined)

  return (
    <Layout>
      <div className="profile-content">
        <section className="profile-hero">
          <div className="profile-hero-inner">
            <div className="hero-left">
              <div className="avatar-circle">
                {typeof profilePicture === 'string' ? (
                  <img src={profilePicture} alt="Profile" />
                ) : (
                  <div className="avatar-fallback">{profileDetails?.username?.[0]?.toUpperCase() || 'U'}</div>
                )}
              </div>
              <div className="avatar-actions column">
                <input
                  id="upload-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) return
                    uploadPictureMutation.mutate(file)
                  }}
                  style={{ display: 'none' }}
                />
                {!otherUsername && (
                  <div className="avatar-buttons">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('upload-photo')?.click()}>
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deletePictureMutation.mutate()}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="hero-center">
              <h1 className="profile-username">{profileDetails?.username ?? 'Profile'}</h1>
              <div className="username-badge">@{profileDetails?.username ?? 'user'}</div>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <Card className="profile-card">
            <CardHeader className="profile-card-header">
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="profile-card-content">
              {!isEditing ? (
                <div className="info-grid">
                  <div className="info-item">
                    <div className="label">Full Name</div>
                    <div className="value">{profileDetails?.name && profileDetails?.surname ? `${profileDetails?.name} ${profileDetails?.surname}` : 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Location</div>
                    <div className="value">{profileDetails?.location || 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Birth Date</div>
                    <div className="value">{profileDetails?.birth_date ? new Date(profileDetails.birth_date).toLocaleDateString() : 'Not specified'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Age</div>
                    <div className="value">{profileDetails?.age || 'Not specified'}</div>
                  </div>
                  <div className="info-item half">
                    <div className="label">Bio</div>
                    <div className="value">{profileDetails?.bio || 'No bio provided.'}</div>
                  </div>
                  <div className="info-item half">
                    <div className="label">Preferred Sports</div>
                    <div className="value">{profileDetails?.preferred_sports || 'Not specified'}</div>
                  </div>
                  {!otherUsername && (
                    <div className="info-actions">
                      <Button size="sm" className="nav-btn" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="edit-grid">
                  <div className="field">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={editedProfile.name} onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })} />
                  </div>
                  <div className="field full">
                    <Label htmlFor="surname">Surname</Label>
                    <Input id="surname" value={editedProfile.surname} onChange={(e) => setEditedProfile({ ...editedProfile, surname: e.target.value })} />
                  </div>
                  <div className="field">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={editedProfile.location} onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })} />
                  </div>
                  <div className="field full">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={editedProfile.bio} onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })} />
                  </div>
                  <div className="field full">
                    <Label htmlFor="preferred_sports">Preferred Sports</Label>
                    <Textarea
                      id="preferred_sports"
                      placeholder="e.g., Running, Swimming, Weightlifting"
                      value={editedProfile.preferred_sports}
                      onChange={(e) => setEditedProfile({ ...editedProfile, preferred_sports: e.target.value })}
                    />
                    <div className="field">
                      <Label htmlFor="birth_date">Birth Date</Label>
                      <Input id="birth_date" type="date" value={editedProfile.birth_date} onChange={(e) => setEditedProfile({ ...editedProfile, birth_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="actions">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={onSave}>Save Changes</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="profile-section">
          <Card className="profile-card">
            <CardHeader className="profile-card-header goals-header">
              <CardTitle>Goals</CardTitle>
              {!otherUsername && goals.length > 0 && (
                <Button className="nav-btn" onClick={() => window.location.href = '/goals?new=true'}>
                  Create Goal
                </Button>
              )}
            </CardHeader>
            <CardContent className="profile-card-content">
              {goals.length > 0 ? (
                <div className="goals-grid">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="goal-card"
                      onClick={() => { setSelectedGoal(goal); setIsGoalDetailOpen(true); }}
                    >
                      <div className="goal-header">
                        <h4>{goal.title}</h4>
                        <span className={`goal-status ${String(goal.status || '').toLowerCase()}`}>{goal.status}</span>
                      </div>
                      <div className="goal-desc">{goal.description}</div>
                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100))}%` }} />
                        </div>
                        <div className="progress-text">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-goals">
                  <div className="empty-icon">🎯</div>
                  <div className="empty-title">No Goals Set</div>
                  <div className="empty-desc">{otherUsername ? 'This user has not set any goals yet.' : "You haven't set any fitness goals yet."}</div>
                  {!otherUsername && (
                    <Button className="nav-btn" onClick={() => window.location.href = '/goals?new=true'}>
                      Set Your First Goal
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Dialog open={isGoalDetailOpen} onOpenChange={setIsGoalDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedGoal?.title || 'Goal Details'}</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <div className="goal-detail">
                <div className="detail-row"><span className="label">Type</span><span className="value">{selectedGoal.goal_type}</span></div>
                <div className="detail-row"><span className="label">Status</span><span className="value">{selectedGoal.status}</span></div>
                <div className="detail-row"><span className="label">Description</span><span className="value">{selectedGoal.description || '—'}</span></div>
                <div className="detail-row"><span className="label">Progress</span><span className="value">{selectedGoal.current_value} / {selectedGoal.target_value} {selectedGoal.unit}</span></div>
                <div className="detail-row"><span className="label">Started</span><span className="value">{new Date(selectedGoal.start_date).toLocaleDateString()}</span></div>
                <div className="detail-row"><span className="label">Target Date</span><span className="value">{new Date(selectedGoal.target_date).toLocaleDateString()}</span></div>
                <div className="dialog-actions">
                  <Button className="nav-btn" onClick={() => setIsGoalDetailOpen(false)}>Close</Button>
                  {!otherUsername && (
                    <Button className="nav-btn" onClick={handleDeleteSelectedGoal}>Delete Goal</Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}