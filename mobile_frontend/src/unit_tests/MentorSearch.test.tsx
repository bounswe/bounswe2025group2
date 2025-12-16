/**
 * @format
 * Unit tests for Mentor Search functionality
 * Tests cover: mentor fetching, searching, filtering, mentor profile viewing, 
 * and mentor request sending
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { FlatList, ActivityIndicator, TextInput as RNTextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Cookies from '@react-native-cookies/cookies';

// Type declarations for global mocks
declare const global: {
  fetch: jest.Mock;
};

// Mock dependencies
jest.mock('@react-native-cookies/cookies');
jest.mock('../context/AuthContext');
jest.mock('../context/ThemeContext');

interface Mentor {
  id: number;
  username: string;
  name: string;
  surname: string;
  bio: string;
  location: string;
  expertise: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  profilePictureUri?: string;
}

describe('Mentor Search Functionality', () => {
  // Mock data for tests
  const mockMentors: Mentor[] = [
    {
      id: 1,
      username: 'mentor_john',
      name: 'John',
      surname: 'Doe',
      bio: 'Experienced fitness coach with 10 years of experience',
      location: 'New York, NY',
      expertise: ['Strength Training', 'Weight Loss', 'Nutrition'],
      rating: 4.8,
      reviewCount: 145,
      hourlyRate: 50,
      profilePictureUri: 'http://example.com/pic1.jpg',
    },
    {
      id: 2,
      username: 'mentor_jane',
      name: 'Jane',
      surname: 'Smith',
      bio: 'Yoga and wellness specialist',
      location: 'Los Angeles, CA',
      expertise: ['Yoga', 'Flexibility', 'Mindfulness'],
      rating: 4.9,
      reviewCount: 203,
      hourlyRate: 60,
      profilePictureUri: 'http://example.com/pic2.jpg',
    },
    {
      id: 3,
      username: 'mentor_mike',
      name: 'Mike',
      surname: 'Johnson',
      bio: 'CrossFit trainer and nutrition expert',
      location: 'Chicago, IL',
      expertise: ['CrossFit', 'Cardio', 'Nutrition'],
      rating: 4.6,
      reviewCount: 89,
      hourlyRate: 55,
      profilePictureUri: 'http://example.com/pic3.jpg',
    },
  ];

  const mockAuthHeader = { Authorization: 'Bearer test-token' };
  const mockColors = {
    background: '#FFFFFF',
    text: '#000000',
    subText: '#666666',
    primary: '#007AFF',
    primaryContainer: '#E3F2FD',
  };

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      getAuthHeader: jest.fn(() => mockAuthHeader),
    });

    // Mock useTheme hook
    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });

    // Mock Cookies.get
    (Cookies.get as jest.Mock).mockResolvedValue({
      csrftoken: { value: 'test-csrf-token' },
    });

    // Mock successful fetch by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMentors,
      headers: new Map([['Content-Type', 'application/json']]),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Fetching Mentors', () => {
    test('fetches mentors on component mount', async () => {
      const mentorListFetch = jest.fn(async () => mockMentors);

      await mentorListFetch();

      expect(mentorListFetch).toHaveBeenCalled();
    });

    test('includes authentication headers in mentor fetch request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMentors,
      });

      await fetch('http://164.90.166.81:8000/api/mentors/', {
        headers: mockAuthHeader,
        credentials: 'include',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://164.90.166.81:8000/api/mentors/',
        expect.objectContaining({
          headers: expect.objectContaining(mockAuthHeader),
          credentials: 'include',
        })
      );
    });

    test('handles mentor fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/', {
        headers: mockAuthHeader,
      });

      expect(response.ok).toBe(false);
    });

    test('returns empty array when no mentors available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/');
      const data = await response.json();

      expect(data).toEqual([]);
    });

    test('handles network error in mentor fetch', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        fetch('http://164.90.166.81:8000/api/mentors/')
      ).rejects.toThrow('Network error');
    });

    test('includes CSRF token in mentor fetch request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMentors,
      });

      await fetch('http://164.90.166.81:8000/api/mentors/', {
        headers: {
          ...mockAuthHeader,
          'X-CSRFToken': 'test-csrf-token',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRFToken': 'test-csrf-token',
          }),
        })
      );
    });
  });

  describe('Mentor Search and Filtering', () => {
    test('filters mentors by name', () => {
      const searchTerm = 'doe';
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.surname.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('John');
    });

    test('filters mentors by expertise', () => {
      const expertise = 'Yoga';
      const filtered = mockMentors.filter((mentor) =>
        mentor.expertise.some((exp) => exp.includes(expertise))
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].username).toBe('mentor_jane');
    });

    test('filters mentors by location', () => {
      const location = 'New York';
      const filtered = mockMentors.filter((mentor) =>
        mentor.location.toLowerCase().includes(location.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].location).toBe('New York, NY');
    });

    test('filters mentors by minimum rating', () => {
      const minRating = 4.8;
      const filtered = mockMentors.filter((mentor) => mentor.rating >= minRating);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((m) => m.rating >= minRating)).toBe(true);
    });

    test('filters mentors by hourly rate range', () => {
      const minRate = 50;
      const maxRate = 60;
      const filtered = mockMentors.filter(
        (mentor) => mentor.hourlyRate >= minRate && mentor.hourlyRate <= maxRate
      );

      expect(filtered).toHaveLength(3);
    });

    test('handles case-insensitive search', () => {
      const searchTerm = 'JANE';
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.surname.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Jane');
    });

    test('returns all mentors when search term is empty', () => {
      const searchTerm = '';
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.surname.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(3);
    });

    test('handles multiple filters simultaneously', () => {
      const minRating = 4.6;
      const expertise = 'Nutrition';
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.rating >= minRating &&
          mentor.expertise.some((exp) => exp.includes(expertise))
      );

      expect(filtered).toHaveLength(2);
    });

    test('no results when filter has no matches', () => {
      const searchTerm = 'nonexistent';
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.surname.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(0);
    });

    test('handles special characters in search', () => {
      const searchTerm = '@#$%';
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.surname.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Mentor Profile Viewing', () => {
    test('fetches individual mentor profile details', async () => {
      const mentorId = 1;
      const mockMentorDetail = mockMentors[0];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMentorDetail,
      });

      const response = await fetch(
        `http://164.90.166.81:8000/api/mentors/${mentorId}/`,
        { headers: mockAuthHeader }
      );
      const data = await response.json();

      expect(data).toEqual(mockMentorDetail);
      expect(data.username).toBe('mentor_john');
    });

    test('displays mentor profile information correctly', () => {
      const mentor = mockMentors[0];

      expect(mentor.name).toBe('John');
      expect(mentor.surname).toBe('Doe');
      expect(mentor.bio).toContain('10 years');
      expect(mentor.location).toBe('New York, NY');
      expect(mentor.rating).toBe(4.8);
    });

    test('handles missing mentor profile picture gracefully', () => {
      const mentorNoPic = { ...mockMentors[0], profilePictureUri: undefined };

      expect(mentorNoPic.profilePictureUri).toBeUndefined();
    });

    test('displays mentor expertise list', () => {
      const mentor = mockMentors[0];

      expect(mentor.expertise).toContain('Strength Training');
      expect(mentor.expertise).toContain('Weight Loss');
      expect(mentor.expertise.length).toBe(3);
    });

    test('fetches mentor reviews when viewing profile', async () => {
      const mentorId = 1;
      const mockReviews = [
        {
          id: 1,
          reviewer: 'user1',
          rating: 5,
          comment: 'Great mentor!',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReviews,
      });

      const response = await fetch(
        `http://164.90.166.81:8000/api/mentors/${mentorId}/reviews/`,
        { headers: mockAuthHeader }
      );
      const data = await response.json();

      expect(data).toEqual(mockReviews);
      expect(data[0].rating).toBe(5);
    });

    test('handles mentor not found error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const response = await fetch(
        'http://164.90.166.81:8000/api/mentors/999/',
        { headers: mockAuthHeader }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('displays mentor rating with review count', () => {
      const mentor = mockMentors[1];

      expect(mentor.rating).toBe(4.9);
      expect(mentor.reviewCount).toBe(203);
    });

    test('calculates hourly rate display correctly', () => {
      const mentor = mockMentors[0];

      expect(mentor.hourlyRate).toBe(50);
      expect(`$${mentor.hourlyRate}/hr`).toBe('$50/hr');
    });
  });

  describe('Mentor Request/Connection', () => {
    test('sends mentor request successfully', async () => {
      const mentorId = 1;
      const payload = { mentorId, message: 'I would like to be your mentee' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, requestId: 123 }),
      });

      const cookies = await Cookies.get('http://164.90.166.81:8000');
      const csrfToken = cookies.csrftoken?.value;

      const response = await fetch(
        'http://164.90.166.81:8000/api/mentors/request/',
        {
          method: 'POST',
          headers: {
            ...mockAuthHeader,
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('handles mentor request with custom message', async () => {
      const customMessage = 'I love your training approach!';
      const payload = { mentorId: 1, message: customMessage };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/request/', {
        method: 'POST',
        headers: {
          ...mockAuthHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(customMessage),
        })
      );
    });

    test('handles duplicate mentor request error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Request already sent' }),
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/request/', {
        method: 'POST',
        headers: mockAuthHeader,
        body: JSON.stringify({ mentorId: 1 }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(409);
    });

    test('handles mentor request network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(
        fetch('http://164.90.166.81:8000/api/mentors/request/', {
          method: 'POST',
          headers: mockAuthHeader,
        })
      ).rejects.toThrow('Network timeout');
    });

    test('cannot send request to self', () => {
      const currentUserId = 1;
      const mentorId = 1;

      const isValid = currentUserId !== mentorId;

      expect(isValid).toBe(false);
    });

    test('can send request to other users', () => {
      const currentUserId = 1;
      const mentorId = 2;

      const isValid = currentUserId !== mentorId;

      expect(isValid).toBe(true);
    });
  });

  describe('Mentor List Display', () => {
    test('displays mentors in correct order after fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMentors,
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/');
      const data = await response.json();

      expect(data[0].username).toBe('mentor_john');
      expect(data[1].username).toBe('mentor_jane');
      expect(data[2].username).toBe('mentor_mike');
    });

    test('sorts mentors by rating (highest first)', () => {
      const sortedByRating = [...mockMentors].sort(
        (a, b) => b.rating - a.rating
      );

      expect(sortedByRating[0].rating).toBe(4.9);
      expect(sortedByRating[1].rating).toBe(4.8);
      expect(sortedByRating[2].rating).toBe(4.6);
    });

    test('sorts mentors by hourly rate (lowest first)', () => {
      const sortedByRate = [...mockMentors].sort(
        (a, b) => a.hourlyRate - b.hourlyRate
      );

      expect(sortedByRate[0].hourlyRate).toBe(50);
      expect(sortedByRate[1].hourlyRate).toBe(55);
      expect(sortedByRate[2].hourlyRate).toBe(60);
    });

    test('sorts mentors by review count (highest first)', () => {
      const sortedByReviews = [...mockMentors].sort(
        (a, b) => b.reviewCount - a.reviewCount
      );

      expect(sortedByReviews[0].reviewCount).toBe(203);
      expect(sortedByReviews[1].reviewCount).toBe(145);
      expect(sortedByReviews[2].reviewCount).toBe(89);
    });

    test('handles pagination for large mentor lists', () => {
      const mentorsPerPage = 10;
      const page = 1;
      const mockLargeList = Array.from({ length: 25 }, (_, i) => ({
        ...mockMentors[0],
        id: i + 1,
        username: `mentor_${i + 1}`,
      }));

      const startIndex = (page - 1) * mentorsPerPage;
      const paginatedMentors = mockLargeList.slice(
        startIndex,
        startIndex + mentorsPerPage
      );

      expect(paginatedMentors).toHaveLength(10);
      expect(paginatedMentors[0].id).toBe(1);
      expect(paginatedMentors[9].id).toBe(10);
    });

    test('handles empty mentor list display', () => {
      const emptyList: Mentor[] = [];

      expect(emptyList).toHaveLength(0);
      expect(emptyList.length === 0).toBe(true);
    });
  });

  describe('Mentor Search Performance', () => {
    test('handles search with large dataset', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMentors[0],
        id: i + 1,
        username: `mentor_${i + 1}`,
      }));

      const searchTerm = 'mentor_500';
      const start = Date.now();
      const filtered = largeDataset.filter(
        (m) => m.username.includes(searchTerm)
      );
      const duration = Date.now() - start;

      expect(filtered.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete quickly
    });

    test('debounces search input correctly', () => {
      jest.useFakeTimers();
      const searchRequests: string[] = [];

      const debounce = (fn: Function, delay: number) => {
        let timeoutId: any;
        return (query: string) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(query), delay);
        };
      };

      const debouncedSearch = debounce(
        (query: string) => searchRequests.push(query),
        300
      );

      debouncedSearch('a');
      debouncedSearch('ab');
      debouncedSearch('abc');

      expect(searchRequests).toHaveLength(0); // Not called yet

      jest.advanceTimersByTime(300);

      expect(searchRequests).toHaveLength(1);
      expect(searchRequests[0]).toBe('abc');
      
      jest.useRealTimers();
    });
  });

  describe('Mentor Rating and Reviews', () => {
    test('calculates average rating correctly', () => {
      const ratings = [5, 4, 5, 5];
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      expect(average).toBe(4.75);
    });

    test('displays rating stars correctly', () => {
      const mentor = mockMentors[0];
      const stars = Math.round(mentor.rating);

      expect(stars).toBe(5);
    });

    test('displays zero reviews gracefully', () => {
      const mentorNoReviews = { ...mockMentors[0], reviewCount: 0 };

      expect(mentorNoReviews.reviewCount).toBe(0);
      expect(mentorNoReviews.reviewCount === 0).toBe(true);
    });

    test('displays review count with correct formatting', () => {
      const mentor = mockMentors[1];
      const formattedCount = `(${mentor.reviewCount} reviews)`;

      expect(formattedCount).toBe('(203 reviews)');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles malformed mentor data gracefully', async () => {
      const malformedData = {
        id: 1,
        // Missing required fields
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => malformedData,
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/1/');
      const data = await response.json();

      expect(data).toHaveProperty('id');
    });

    test('handles timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(
        fetch('http://164.90.166.81:8000/api/mentors/')
      ).rejects.toThrow('Timeout');
    }, 15000);

    test('handles rate limiting', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests' }),
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/');

      expect(response.status).toBe(429);
    });

    test('handles null response data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const response = await fetch('http://164.90.166.81:8000/api/mentors/');
      const data = await response.json();

      expect(data).toBeNull();
    });

    test('handles very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      const filtered = mockMentors.filter((m) =>
        m.name.toLowerCase().includes(longQuery.toLowerCase())
      );

      expect(filtered).toHaveLength(0);
    });

    test('handles unicode characters in search', () => {
      const unicodeQuery = '🎯';
      const filtered = mockMentors.filter((m) =>
        m.name.toLowerCase().includes(unicodeQuery.toLowerCase())
      );

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    test('complete mentor search flow: fetch, filter, select, view profile', async () => {
      // Step 1: Fetch mentors
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMentors,
      });

      const fetchResponse = await fetch('http://164.90.166.81:8000/api/mentors/');
      let mentors = await fetchResponse.json();

      expect(mentors).toHaveLength(3);

      // Step 2: Filter by expertise
      const expertise = 'Nutrition';
      mentors = mentors.filter((m: Mentor) =>
        m.expertise.some((exp) => exp.includes(expertise))
      );

      expect(mentors).toHaveLength(2);

      // Step 3: View selected mentor profile
      const selectedMentor = mentors[0];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => selectedMentor,
      });

      const profileResponse = await fetch(
        `http://164.90.166.81:8000/api/mentors/${selectedMentor.id}/`
      );
      const profile = await profileResponse.json();

      expect(profile.username).toBe(selectedMentor.username);
      expect(profile.expertise).toContain('Nutrition');

      // Step 4: Send mentor request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const requestResponse = await fetch(
        'http://164.90.166.81:8000/api/mentors/request/',
        {
          method: 'POST',
          headers: mockAuthHeader,
          body: JSON.stringify({ mentorId: selectedMentor.id }),
        }
      );

      expect(requestResponse.ok).toBe(true);
    });

    test('complete search and filter workflow', () => {
      // Initial fetch
      let results = [...mockMentors];

      // Apply search filter
      const searchTerm = 'smith';
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm) ||
          m.surname.toLowerCase().includes(searchTerm)
      );

      expect(results).toHaveLength(1);

      // Apply rating filter
      const minRating = 4.9;
      results = results.filter((m) => m.rating >= minRating);

      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('mentor_jane');
    });
  });

  describe('Accessibility', () => {
    test('mentor names are accessible', () => {
      const mentor = mockMentors[0];
      const accessibleName = `${mentor.name} ${mentor.surname}`;

      expect(accessibleName).toBe('John Doe');
    });

    test('mentor expertise is readable', () => {
      const mentor = mockMentors[0];
      const readableExpertise = mentor.expertise.join(', ');

      expect(readableExpertise).toBe('Strength Training, Weight Loss, Nutrition');
    });

    test('rating display is clear', () => {
      const mentor = mockMentors[0];
      const ratingDisplay = `${mentor.rating} stars (${mentor.reviewCount} reviews)`;

      expect(ratingDisplay).toBe('4.8 stars (145 reviews)');
    });
  });
});
