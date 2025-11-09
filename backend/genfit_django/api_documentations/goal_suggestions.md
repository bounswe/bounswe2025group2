# Goal Suggestions API Documentation

## Overview
The Goal Suggestions API provides AI-powered recommendations for fitness goals based on user profile, existing goals, and the new goal's title and description. This endpoint uses the Groq AI API to analyze user context and generate personalized suggestions.

## Endpoint

### Get Goal Suggestions
`POST /api/goals/suggestions/`

Get AI-powered suggestions for a new fitness goal including target value, target date, goal type, exercise tips, and personalized advice.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "title": "Run my first 5K",
  "description": "I want to be able to run 5 kilometers without stopping"
}
```

**Fields:**
- `title` (string, required): The title of the fitness goal
- `description` (string, optional): Detailed description of what the user wants to achieve

**Response (200 OK):**
```json
{
  "suggested_target_value": 5.0,
  "suggested_unit": "km",
  "suggested_target_date_days": 45,
  "goal_type": "WALKING_RUNNING",
  "exercise_tips": "Start with a walk-run program: alternate 2 minutes of running with 2 minutes of walking for 20-30 minutes, 3 times per week. Gradually increase running intervals as your endurance improves. Always warm up with 5 minutes of brisk walking and cool down with stretching. Focus on maintaining a conversational pace - you should be able to talk while running.",
  "personalized_advice": "Based on your age (25 years old) and current fitness level, this goal is achievable within 6-8 weeks with consistent training. Since you're already working on a cycling goal, try to schedule your runs on alternate days to allow proper recovery. Your location in San Francisco offers great running trails - consider varying your routes to keep motivation high.",
  "reasoning": "Given that this is your first 5K goal and you have an active cycling routine, I've suggested a 45-day timeline. This allows adequate time to build running-specific endurance without overtraining, especially since you're balancing multiple fitness activities."
}
```

**Response Fields:**
- `suggested_target_value` (number): Recommended target value for the goal (e.g., 5.0 for 5 kilometers)
- `suggested_unit` (string): Unit of measurement (e.g., "km", "minutes", "reps", "meters")
- `suggested_target_date_days` (number): Recommended number of days from today to achieve the goal (7-90 days)
- `goal_type` (string): One of: `WALKING_RUNNING`, `WORKOUT`, `CYCLING`, `SWIMMING`, `SPORTS`
- `exercise_tips` (string): Specific, actionable advice on how to perform the exercise and achieve the goal
- `personalized_advice` (string): Customized advice based on the user's profile, age, current goals, and fitness level
- `reasoning` (string): Brief explanation of why these specific values and timeline were suggested

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Title is required"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to generate suggestions",
  "detail": "Error message"
}
```

## How It Works

### Context Analysis
The AI analyzes the following user information:
1. **Profile Data**: Name, age, location, bio
2. **Active Goals**: Current fitness goals with progress
3. **Completed Goals**: Recently finished goals
4. **Challenge Participation**: Active challenges and progress

### Suggestion Generation
The AI considers:
- User's current fitness level based on existing goals
- Age and profile information for realistic recommendations
- Potential conflicts with existing activities to avoid overtraining
- Goal-specific best practices and training methodologies
- Personalization based on user's location, bio, and fitness history

### Error Handling
If the AI service is unavailable or fails, the endpoint returns a 500 error. The frontend should display an appropriate message to the user (e.g., "Suggestions feature is currently unavailable. Please try again later or create your goal manually.").

## Usage Example

### JavaScript/TypeScript (Frontend)
```typescript
async function getGoalSuggestions(title: string, description: string) {
  const response = await fetch('/api/goals/suggestions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      title,
      description
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get suggestions');
  }
  
  return await response.json();
}

// Usage
const suggestions = await getGoalSuggestions(
  "Run my first 5K",
  "I want to be able to run 5 kilometers without stopping"
);

console.log(`Suggested target: ${suggestions.suggested_target_value} ${suggestions.suggested_unit}`);
console.log(`Timeline: ${suggestions.suggested_target_date_days} days`);
console.log(`Goal type: ${suggestions.goal_type}`);
```

### Python (Backend Testing)
```python
import requests

def test_goal_suggestions():
    url = 'http://localhost:8000/api/goals/suggestions/'
    headers = {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
    }
    data = {
        'title': 'Run my first 5K',
        'description': 'I want to be able to run 5 kilometers without stopping'
    }
    
    response = requests.post(url, json=data, headers=headers)
    print(response.json())
```

## Goal Types Reference

| Goal Type | Description | Common Units | Example Activities |
|-----------|-------------|--------------|-------------------|
| WALKING_RUNNING | Walking or running activities | km, miles, steps | Running, jogging, walking |
| WORKOUT | General workout/training | minutes, hours, reps | Gym workouts, strength training |
| CYCLING | Cycling activities | km, miles | Road cycling, mountain biking |
| SWIMMING | Swimming activities | meters, km, laps | Pool swimming, open water |
| SPORTS | Sport-specific activities | minutes, hours, games | Basketball, tennis, soccer |

## Best Practices

1. **Provide Clear Descriptions**: The more detailed the description, the better the AI can tailor suggestions
2. **Update Profile**: Keep your profile information current for more personalized advice
3. **Review Suggestions**: AI suggestions are recommendations - adjust based on your personal knowledge and comfort level
4. **Consult Professionals**: For medical conditions or concerns, consult healthcare providers before starting new fitness programs
5. **Progressive Loading**: Follow the suggested timeline to avoid injury and ensure sustainable progress

## Integration Notes

### For Frontend Developers
- Display suggestions in a popup/modal when users create new goals
- Allow users to accept, modify, or ignore suggestions
- Pre-fill goal creation form with suggested values
- Show exercise tips and personalized advice prominently
- Use the `goal_type` to set the correct goal category
- **Handle 500 errors gracefully**: Show message like "Suggestions feature is currently unavailable. Please create your goal manually."
- Consider showing a fallback UI that allows manual goal creation without suggestions

### For Backend Developers
- Endpoint requires authentication via DRF authentication
- Uses Groq API - ensure `GROQ_API_KEY` is set in environment
- Returns 500 error if AI service fails (no fallback suggestions)
- Response time: typically 2-5 seconds depending on AI service
- Consider caching suggestions for same title/description pairs

## Environment Variables

Required environment variable:
```
GROQ_API_KEY=your_groq_api_key_here
```

Add this to your `.env` file in the backend directory.
