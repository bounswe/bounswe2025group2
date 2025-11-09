# Goal Suggestions API Documentation

## Overview
The Goal Suggestions API provides AI-powered, SAFE, and REALISTIC recommendations for fitness goals based on user profile, existing goals, and the new goal's title and description. This endpoint uses the Groq AI API to analyze user context and generate personalized suggestions while validating goal safety.

## Endpoint

### Get Goal Suggestions
`POST /api/goals/suggestions/`

Get AI-powered suggestions for a new fitness goal including target value, target date, goal type, and a concise actionable tip. The AI automatically validates if the goal is realistic and safe, providing warnings and safer alternatives for dangerous or impossible goals.

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

**Response (200 OK - Realistic Goal):**
```json
{
  "is_realistic": true,
  "warning_message": null,
  "target_value": 5.0,
  "unit": "km",
  "days_to_complete": 45,
  "goal_type": "WALKING_RUNNING",
  "tips": [
    "Start with walk-run intervals, 3x per week for 20-30 minutes.",
    "Increase running time by 10% each week to avoid injury.",
    "Stay hydrated and stretch after each session."
  ]
}
```

**Response (200 OK - Unrealistic Goal with Warning):**
```json
{
  "is_realistic": false,
  "warning_message": "Losing 30kg in 1 week is medically dangerous and impossible. A safe target is 0.5-1kg per week. Consider a 30-60 week timeline for sustainable weight loss.",
  "target_value": 0.5,
  "unit": "kg",
  "days_to_complete": 7,
  "goal_type": "WORKOUT",
  "tips": [
    "Focus on sustainable calorie deficit with regular exercise.",
    "Combine cardio with strength training 4-5 times weekly.",
    "Prioritize protein intake and adequate sleep for recovery."
  ]
}
```

**Response Fields:**
- `is_realistic` (boolean): `true` if the goal is safe and achievable, `false` if dangerous or impossible
- `warning_message` (string or null): If `is_realistic` is `false`, contains explanation of why the goal is unrealistic and suggests a safer alternative. Otherwise `null`.
- `target_value` (number): Recommended target value (realistic even if user's request was unrealistic)
- `unit` (string): Unit of measurement (e.g., "km", "minutes", "reps", "meters", "kg")
- `days_to_complete` (number): Recommended days from today to achieve the goal (1-6000 days)
- `goal_type` (string): One of: `WALKING_RUNNING`, `WORKOUT`, `CYCLING`, `SWIMMING`, `SPORTS`
- `tips` (array of strings): Exactly 3 actionable tips (each max 150 characters), covering different aspects like technique, progression, and recovery

**Error Responses:**

400 Bad Request - Missing title:
```json
{
  "error": "Title is required"
}
```

500 Internal Server Error - AI service failure:
```json
{
  "error": "Failed to generate suggestions",
  "detail": "AI suggestion service error: Connection error"
}
```

## How It Works

### Context Analysis
The AI analyzes the following user information:
1. **Profile Data**: Name, age, location, bio
2. **Active Goals**: Current fitness goals with progress
3. **Completed Goals**: Recently finished goals
4. **Challenge Participation**: Active challenges and progress

### Suggestion Generation & Safety Validation
The AI considers:
- User's current fitness level based on existing goals
- Age and profile information for realistic recommendations
- Potential conflicts with existing activities to avoid overtraining
- Goal-specific best practices and training methodologies
- Personalization based on user's location, bio, and fitness history
- **Safety validation**: Detects dangerous or impossible goals (e.g., extreme weight loss, superhuman distances)
- **Automatic corrections**: Provides safer alternatives for unrealistic goals

### Retry Logic
The system includes automatic retry logic:
- If AI returns invalid JSON, it retries up to 3 times
- Each retry includes stronger instructions to return valid JSON
- Temperature set to 0.5 for more consistent responses
- After 4 failed attempts, returns 500 error

### Error Handling
If the AI service is unavailable or fails after retries, the endpoint returns a 500 error. The frontend should display: "Suggestions feature is currently unavailable. Please create your goal manually."

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
    throw new Error('Suggestions feature is currently unavailable');
  }
  
  const data = await response.json();
  
  // Check if goal is unrealistic
  if (!data.is_realistic) {
    showWarning({
      title: "⚠️ Unrealistic Goal Detected",
      message: data.warning_message,
      suggestion: `We suggest: ${data.target_value} ${data.unit} in ${data.days_to_complete} days`,
      tips: data.tips
    });
  } else {
    showSuggestions(data);
  }
  
  return data;
}

// Usage
const suggestions = await getGoalSuggestions(
  "Run my first 5K",
  "I want to be able to run 5 kilometers without stopping"
);

console.log(`Realistic: ${suggestions.is_realistic}`);
console.log(`Target: ${suggestions.target_value} ${suggestions.unit}`);
console.log(`Timeline: ${suggestions.days_to_complete} days`);
console.log(`Tips:`);
suggestions.tips.forEach((tip, i) => console.log(`  ${i + 1}. ${tip}`));
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
    result = response.json()
    
    if result.get('is_realistic'):
        print(f"✅ Realistic goal: {result['target_value']} {result['unit']} in {result['days_to_complete']} days")
        print("Tips:")
        for i, tip in enumerate(result['tips'], 1):
            print(f"  {i}. {tip}")
    else:
        print(f"⚠️ Unrealistic goal!")
        print(f"Warning: {result['warning_message']}")
        print(f"Safe alternative: {result['target_value']} {result['unit']} in {result['days_to_complete']} days")
        print("Tips:")
        for i, tip in enumerate(result['tips'], 1):
            print(f"  {i}. {tip}")
    
    print(f"Tip: {result['tip']}")
```

## Example Scenarios

### Realistic Goal Example
**Request:**
```json
{
  "title": "Start running regularly",
  "description": "I want to run 5K"
}
```

**Response:**
```json
{
  "is_realistic": true,
  "warning_message": null,
  "target_value": 5.0,
  "unit": "km",
  "days_to_complete": 45,
  "goal_type": "WALKING_RUNNING",
  "tips": [
    "Start with walk-run intervals, 3x per week for 20-30 minutes.",
    "Increase running time by 10% each week to avoid injury.",
    "Stay hydrated and stretch after each session."
  ]
}
```

### Unrealistic Goal Example (Dangerous Weight Loss)
**Request:**
```json
{
  "title": "Rapid weight loss",
  "description": "I want to lose 30kg in one week"
}
```

**Response:**
```json
{
  "is_realistic": false,
  "warning_message": "Losing 30kg in 1 week is medically dangerous and impossible. A safe target is 0.5-1kg per week. Consider a 30-60 week timeline for sustainable weight loss.",
  "target_value": 0.5,
  "unit": "kg",
  "days_to_complete": 7,
  "goal_type": "WORKOUT",
  "tips": [
    "Focus on sustainable calorie deficit with regular exercise.",
    "Combine cardio with strength training 4-5 times weekly.",
    "Prioritize protein intake and adequate sleep for recovery."
  ]
}
```

### Unrealistic Goal Example (Impossible Distance)
**Request:**
```json
{
  "title": "Ultra run today",
  "description": "Run 200km today"
}
```

**Response:**
```json
{
  "is_realistic": false,
  "warning_message": "Running 200km in one day exceeds human physical limits. World-class ultramarathoners take 20+ hours for 100km. Start with a 10K goal.",
  "target_value": 10.0,
  "unit": "km",
  "days_to_complete": 60,
  "goal_type": "WALKING_RUNNING",
  "tips": [
    "Build distance gradually with long runs once per week.",
    "Run at conversational pace to build aerobic base.",
    "Include rest days for muscle recovery and injury prevention."
  ]
}
```

## Goal Types Reference

| Goal Type | Description | Common Units | Example Activities |
|-----------|-------------|--------------|-------------------|
| WALKING_RUNNING | Walking or running activities | km, miles, steps | Running, jogging, walking |
| WORKOUT | General workout/training | minutes, hours, reps, kg | Gym workouts, strength training, weight loss |
| CYCLING | Cycling activities | km, miles | Road cycling, mountain biking |
| SWIMMING | Swimming activities | meters, km, laps | Pool swimming, open water |
| SPORTS | Sport-specific activities | minutes, hours, games, events | Basketball, tennis, soccer, competitions |

## Best Practices

1. **Provide Clear Descriptions**: The more detailed the description, the better the AI can tailor suggestions
2. **Update Profile**: Keep your profile information current for more personalized advice
3. **Review Suggestions**: AI suggestions are recommendations - adjust based on your personal knowledge and comfort level
4. **Heed Warnings**: If `is_realistic` is `false`, seriously consider the warning message
5. **Consult Professionals**: For medical conditions or concerns, consult healthcare providers before starting new fitness programs
6. **Progressive Loading**: Follow the suggested timeline to avoid injury and ensure sustainable progress

## Integration Notes

### For Frontend Developers
- Display suggestions in a popup/modal when users create new goals
- **Check `is_realistic` flag**: Show warning UI if `false`
- For unrealistic goals:
  - Display warning message prominently
  - Show the safer alternative suggestion
  - Give options: "Use Safe Alternative" or "Modify My Goal"
- For realistic goals:
  - Show target, timeline, goal type, and tip
  - Allow users to accept (auto-fill form) or modify
- Pre-fill goal creation form with suggested values
- Use the `goal_type` to set the correct goal category dropdown
- Keep UI simple: Display ONE tip, not multiple fields
- **Handle 500 errors gracefully**: Show "Suggestions feature is currently unavailable. Please create your goal manually."

### For Backend Developers
- Endpoint requires authentication via DRF authentication
- Uses Groq API - ensure `GROQ_API_KEY` is set in environment
- Temperature set to 0.5 for consistent responses
- Automatic retry logic (up to 3 retries) for invalid JSON
- Response time: typically 2-5 seconds (up to 10 seconds with retries)
- Returns 500 error if all retries fail
- Always returns 200 for successful AI responses (check `is_realistic` in response)

## Environment Variables

Required environment variable:
```
GROQ_API_KEY=your_groq_api_key_here
```

Add this to your `.env` file in the backend directory.
