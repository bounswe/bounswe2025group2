import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../../components';
import { 
  searchExercises, 
  getRateLimitStatus,
  getExerciseDetail,
  type Exercise,
  type ExerciseDetail,
  type RateLimitStatus 
} from '../../services/exerciseDbService';
import './glossary_page.css';

interface GlossaryExercise {
  id: number;
  name: string;
  description: string;
  muscleGroups: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment?: string;
  instructions?: string[];
  tips?: string;
}

const glossaryExercises: GlossaryExercise[] = [
  {
    id: 1,
    name: 'Push Up',
    description: 'A classic bodyweight exercise that targets the chest, shoulders, and triceps.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulder-width',
      'Lower your body until your chest nearly touches the floor',
      'Push back up to the starting position',
      'Keep your core engaged throughout the movement',
    ],
    tips: 'Keep your body in a straight line from head to heels. Breathe out as you push up.',
  },
  {
    id: 2,
    name: 'Squat',
    description: 'A fundamental lower body exercise that targets the quadriceps, glutes, and hamstrings.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'None (or barbell for weighted squats)',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body as if sitting back into a chair',
      'Keep your knees behind your toes',
      'Lower until thighs are parallel to the floor',
      'Push through your heels to return to standing',
    ],
    tips: 'Keep your chest up and back straight. Don\'t let your knees cave inward.',
  },
  {
    id: 4,
    name: 'Bench Press',
    description: 'A popular upper body exercise primarily targeting the chest muscles.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Intermediate',
    equipment: 'Barbell or dumbbells, bench',
    instructions: [
      'Lie on bench with feet flat on floor',
      'Grip bar slightly wider than shoulder-width',
      'Lower bar to chest with control',
      'Press bar up until arms are fully extended',
      'Keep shoulder blades retracted',
    ],
    tips: 'Use a spotter when lifting heavy. Don\'t bounce the bar off your chest.',
  },
  {
    id: 5,
    name: 'Pull Up',
    description: 'An upper body strength exercise that targets the back and biceps.',
    muscleGroups: ['Back', 'Biceps', 'Shoulders'],
    difficulty: 'Intermediate',
    equipment: 'Pull-up bar',
    instructions: [
      'Hang from bar with palms facing away',
      'Pull your body up until chin is above bar',
      'Lower yourself with control',
      'Keep core engaged throughout',
    ],
    tips: 'Start with assisted pull-ups if needed. Focus on full range of motion.',
  },
  {
    id: 6,
    name: 'Plank',
    description: 'An isometric core exercise that strengthens the entire core and improves stability.',
    muscleGroups: ['Core', 'Shoulders', 'Back'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Start in push-up position',
      'Lower to forearms, elbows under shoulders',
      'Keep body in straight line',
      'Hold position while breathing normally',
    ],
    tips: 'Don\'t let your hips sag or rise. Start with 20-30 seconds and build up.',
  },
  {
    id: 7,
    name: 'Lunges',
    description: 'A unilateral leg exercise that improves balance and targets the legs and glutes.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'None (or dumbbells for weighted lunges)',
    instructions: [
      'Step forward with one leg',
      'Lower your body until both knees are at 90 degrees',
      'Push through front heel to return',
      'Alternate legs',
    ],
    tips: 'Keep your front knee behind your toes. Maintain upright posture.',
  },
  {
    id: 8,
    name: 'Burpees',
    description: 'A full-body exercise that combines a squat, push-up, and jump for cardiovascular and strength benefits.',
    muscleGroups: ['Full Body', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Start in standing position',
      'Squat down and place hands on floor',
      'Jump feet back into plank position',
      'Do a push-up (optional)',
      'Jump feet forward and explode up with arms overhead',
    ],
    tips: 'Start slowly to perfect form. Focus on smooth transitions between movements.',
  },
  {
    id: 9,
    name: 'Overhead Press',
    description: 'A shoulder exercise that targets the deltoids and triceps while engaging the core.',
    muscleGroups: ['Shoulders', 'Triceps', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Barbell or dumbbells',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold weight at shoulder height',
      'Press weight overhead until arms are extended',
      'Lower with control to starting position',
    ],
    tips: 'Keep core tight to protect lower back. Don\'t arch excessively.',
  },
  // Running-Specific
  {
    id: 11,
    name: 'Interval Runs',
    description: 'Alternating periods of high-intensity running with recovery periods to improve speed and cardiovascular fitness.',
    muscleGroups: ['Cardio', 'Legs', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Warm up with 5-10 minutes of easy jogging',
      'Run at high intensity for 1-2 minutes',
      'Recover with slow jog or walk for 1-2 minutes',
      'Repeat intervals 4-8 times',
      'Cool down with 5-10 minutes of easy jogging',
    ],
    tips: 'Start with shorter intervals and gradually increase intensity. Listen to your body and adjust recovery time as needed.',
  },
  {
    id: 12,
    name: 'Tempo Runs',
    description: 'Sustained effort running at a comfortably hard pace to improve lactate threshold.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Warm up for 10 minutes',
      'Run at tempo pace (comfortably hard) for 15-30 minutes',
      'Maintain consistent pace throughout',
      'Cool down for 10 minutes',
    ],
    tips: 'Tempo pace should feel challenging but sustainable. You should be able to say a few words but not hold a conversation.',
  },
  {
    id: 13,
    name: 'Hill Sprints',
    description: 'Short, intense sprints up hills to build power, speed, and leg strength.',
    muscleGroups: ['Legs', 'Glutes', 'Cardio'],
    difficulty: 'Advanced',
    equipment: 'None',
    instructions: [
      'Find a hill with moderate incline',
      'Sprint up the hill for 10-30 seconds',
      'Walk or jog back down for recovery',
      'Repeat 6-10 times',
      'Cool down with easy walking',
    ],
    tips: 'Focus on powerful leg drive and arm swing. Start with fewer repetitions and gradually build up.',
  },
  {
    id: 14,
    name: 'Stride Drills',
    description: 'Short accelerations focusing on proper running form and stride mechanics.',
    muscleGroups: ['Legs', 'Core'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Start with easy jogging',
      'Gradually accelerate over 50-100 meters',
      'Hold near-max speed for 20-30 meters',
      'Gradually decelerate',
      'Recover with easy jogging',
      'Repeat 4-6 times',
    ],
    tips: 'Focus on smooth acceleration and deceleration. Maintain good posture and arm swing throughout.',
  },
  {
    id: 15,
    name: 'Fartlek Training',
    description: 'Unstructured speed play combining continuous running with bursts of faster pace.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Start with easy running',
      'Pick landmarks and sprint to them',
      'Recover with easy running',
      'Vary intensity and duration throughout',
      'Continue for 20-40 minutes total',
    ],
    tips: 'Make it fun and spontaneous. Use trees, lamp posts, or buildings as your speed markers.',
  },
  {
    id: 16,
    name: 'Long Slow Distance (LSD) Run',
    description: 'Extended duration running at a comfortable, conversational pace to build aerobic base.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Run at easy, conversational pace',
      'Maintain pace for 30-90 minutes or longer',
      'Keep heart rate in aerobic zone',
      'Stay hydrated throughout',
    ],
    tips: 'You should be able to hold a conversation while running. This builds endurance without excessive stress.',
  },
  {
    id: 17,
    name: 'Threshold Runs',
    description: 'Running at lactate threshold pace to improve the body\'s ability to clear lactic acid.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Advanced',
    equipment: 'None',
    instructions: [
      'Warm up for 10-15 minutes',
      'Run at threshold pace (hard but sustainable) for 15-25 minutes',
      'Maintain steady effort',
      'Cool down for 10 minutes',
    ],
    tips: 'Threshold pace is typically 10-15 seconds per mile slower than 5K race pace. It should feel hard but controlled.',
  },
  {
    id: 18,
    name: 'Barefoot Grass Runs',
    description: 'Running barefoot on grass to strengthen feet, improve proprioception, and enhance running form.',
    muscleGroups: ['Feet', 'Calves', 'Legs'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Find a safe, soft grass surface',
      'Start with short distances (100-200 meters)',
      'Focus on landing on midfoot or forefoot',
      'Gradually increase distance over time',
      'Be cautious of sharp objects',
    ],
    tips: 'Start slowly to allow feet to adapt. This strengthens foot muscles and improves running mechanics.',
  },
  {
    id: 19,
    name: 'Downhill Speed Runs',
    description: 'Controlled fast running downhill to improve leg turnover and running economy.',
    muscleGroups: ['Legs', 'Quads', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Find a gentle downhill slope',
      'Run at fast but controlled pace',
      'Focus on quick leg turnover',
      'Keep body slightly forward',
      'Recover with easy jogging',
    ],
    tips: 'Be careful not to overstride. Focus on quick, light steps rather than braking with your legs.',
  },
  {
    id: 20,
    name: 'Recovery Jog',
    description: 'Easy, slow-paced running to promote recovery and maintain fitness between hard workouts.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Run at very easy, comfortable pace',
      'Maintain for 20-40 minutes',
      'Keep effort level very low',
      'Focus on relaxation and form',
    ],
    tips: 'This should feel very easy. If you\'re breathing hard, slow down. Recovery runs aid in active recovery.',
  },
  // Walking-Specific
  {
    id: 21,
    name: 'Power Walking',
    description: 'Fast-paced walking with exaggerated arm swing and longer strides to increase intensity.',
    muscleGroups: ['Legs', 'Core', 'Cardio'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Walk at brisk pace with longer strides',
      'Pump arms actively',
      'Maintain upright posture',
      'Land on heel and roll to toe',
      'Continue for 20-60 minutes',
    ],
    tips: 'Keep core engaged and maintain good posture. This is a great low-impact cardio option.',
  },
  {
    id: 22,
    name: 'Incline Treadmill Walking',
    description: 'Walking on an inclined treadmill to increase intensity and target glutes and calves.',
    muscleGroups: ['Glutes', 'Calves', 'Cardio'],
    difficulty: 'Beginner',
    equipment: 'Treadmill',
    instructions: [
      'Set treadmill to 3-5% incline',
      'Walk at moderate pace',
      'Maintain for 20-45 minutes',
      'Keep upright posture',
      'Gradually increase incline if desired',
    ],
    tips: 'Start with lower inclines and gradually increase. This mimics hill walking and builds lower body strength.',
  },
  {
    id: 23,
    name: 'Weighted Backpack Walk (Rucking)',
    description: 'Walking with a weighted backpack to increase resistance and build strength and endurance.',
    muscleGroups: ['Full Body', 'Core', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'Backpack with weight',
    instructions: [
      'Load backpack with 10-20% of body weight',
      'Start with lighter weight',
      'Walk at steady pace for 30-60 minutes',
      'Maintain good posture',
      'Distribute weight evenly',
    ],
    tips: 'Start with lighter weights and gradually increase. Ensure backpack fits well and doesn\'t cause strain.',
  },
  {
    id: 24,
    name: 'Walking Lunges',
    description: 'Forward lunges performed while walking to target legs and glutes with dynamic movement.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Step forward into lunge position',
      'Lower back knee toward ground',
      'Push through front heel to stand',
      'Bring back leg forward into next lunge',
      'Continue for 10-20 steps per leg',
    ],
    tips: 'Keep front knee behind toes. Maintain upright torso and engage core throughout movement.',
  },
  {
    id: 25,
    name: 'Long-Distance Brisk Walk',
    description: 'Extended duration walking at a brisk pace to build cardiovascular endurance.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Walk at brisk, steady pace',
      'Maintain for 45-90 minutes or longer',
      'Keep consistent pace',
      'Stay hydrated',
      'Focus on good posture',
    ],
    tips: 'This is excellent for building endurance with minimal impact. Maintain a pace where you can still talk comfortably.',
  },
  // Strength & Technique for Runners/Walkers
  {
    id: 26,
    name: 'High Knees Drill',
    description: 'Running in place while lifting knees high to improve running form and leg strength.',
    muscleGroups: ['Legs', 'Core', 'Hip Flexors'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Lift one knee toward chest',
      'Quickly switch to other leg',
      'Pump arms naturally',
      'Continue for 20-30 seconds',
    ],
    tips: 'Focus on quick, light foot contacts. This improves running mechanics and strengthens hip flexors.',
  },
  {
    id: 27,
    name: 'Butt Kicks',
    description: 'Running in place while kicking heels toward glutes to improve hamstring flexibility and running form.',
    muscleGroups: ['Hamstrings', 'Calves'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Stand tall and jog in place',
      'Kick heels up toward glutes',
      'Keep knees pointing down',
      'Maintain quick cadence',
      'Continue for 20-30 seconds',
    ],
    tips: 'Focus on quick, light movements. This improves hamstring flexibility and running efficiency.',
  },
  {
    id: 28,
    name: 'A-Skip / B-Skip Drills',
    description: 'Coordination drills that improve running mechanics, rhythm, and lower body strength.',
    muscleGroups: ['Legs', 'Core', 'Coordination'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'A-Skip: Skip forward lifting knee and opposite arm',
      'B-Skip: Add leg extension before landing',
      'Maintain rhythm and coordination',
      'Perform for 20-30 meters',
      'Focus on proper form over speed',
    ],
    tips: 'These drills improve running economy and coordination. Start slowly and focus on technique.',
  },
  {
    id: 29,
    name: 'Calf Raises',
    description: 'Lifting body weight onto toes to strengthen calves, important for running and walking.',
    muscleGroups: ['Calves'],
    difficulty: 'Beginner',
    equipment: 'None (or dumbbells for added resistance)',
    instructions: [
      'Stand with feet hip-width apart',
      'Rise up onto toes',
      'Hold for 1-2 seconds',
      'Lower slowly with control',
      'Repeat 15-25 times',
    ],
    tips: 'Strong calves help with push-off during running and walking. Add weight or do single-leg variations for progression.',
  },
  {
    id: 30,
    name: 'Single-Leg Glute Bridge (Runner\'s Bridge)',
    description: 'Hip bridge performed on one leg to strengthen glutes and improve running stability.',
    muscleGroups: ['Glutes', 'Hamstrings', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Lie on back with one leg bent, other extended',
      'Lift hips up by squeezing glutes',
      'Keep extended leg in line with body',
      'Hold for 2-3 seconds',
      'Lower with control',
      'Repeat 10-15 times per leg',
    ],
    tips: 'Strong glutes are crucial for running power and injury prevention. Focus on glute activation, not just lifting hips.',
  },
  // Cycling Variations
  {
    id: 31,
    name: 'Endurance Ride (Zone 2 Cycling)',
    description: 'Long, steady cycling at moderate intensity to build aerobic base and fat-burning capacity.',
    muscleGroups: ['Legs', 'Cardio'],
    difficulty: 'Beginner',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Cycle at comfortable, steady pace',
      'Maintain for 60-120 minutes or longer',
      'Keep heart rate in Zone 2 (60-70% max)',
      'Maintain consistent cadence',
      'Stay hydrated',
    ],
    tips: 'You should be able to hold a conversation. This builds endurance and improves fat metabolism.',
  },
  {
    id: 32,
    name: 'Tempo Ride',
    description: 'Sustained cycling at a comfortably hard pace to improve lactate threshold.',
    muscleGroups: ['Legs', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Warm up for 10-15 minutes',
      'Cycle at tempo pace for 20-40 minutes',
      'Maintain steady, hard effort',
      'Cool down for 10 minutes',
    ],
    tips: 'Tempo pace should feel challenging but sustainable. Focus on smooth, powerful pedal strokes.',
  },
  {
    id: 33,
    name: 'Hill Climb Intervals',
    description: 'Repeated climbs up hills or increased resistance to build leg strength and power.',
    muscleGroups: ['Legs', 'Glutes', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Find a hill or increase resistance',
      'Climb at hard effort for 2-5 minutes',
      'Recover with easy spinning for 2-3 minutes',
      'Repeat 4-8 times',
      'Cool down with easy spinning',
    ],
    tips: 'Focus on maintaining cadence and power. Stand up occasionally to use different muscle groups.',
  },
  {
    id: 34,
    name: 'Sprint Intervals',
    description: 'Short, maximum effort sprints to improve power, speed, and anaerobic capacity.',
    muscleGroups: ['Legs', 'Cardio'],
    difficulty: 'Advanced',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Warm up thoroughly',
      'Sprint at maximum effort for 10-30 seconds',
      'Recover with easy spinning for 2-4 minutes',
      'Repeat 6-10 times',
      'Cool down completely',
    ],
    tips: 'These are very intense. Ensure proper warm-up and recovery. Focus on explosive power during sprints.',
  },
  {
    id: 35,
    name: 'Cadence Drills (High RPM Work)',
    description: 'Cycling at high revolutions per minute to improve pedaling efficiency and leg speed.',
    muscleGroups: ['Legs', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Cycle at easy resistance',
      'Increase cadence to 100-120 RPM',
      'Maintain for 1-3 minutes',
      'Recover with normal cadence',
      'Repeat 4-6 times',
    ],
    tips: 'Focus on smooth, circular pedal strokes. High cadence reduces muscle fatigue and improves efficiency.',
  },
  {
    id: 36,
    name: 'Low-Cadence Strength Intervals',
    description: 'Cycling at low cadence with high resistance to build leg strength and power.',
    muscleGroups: ['Legs', 'Glutes'],
    difficulty: 'Intermediate',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Increase resistance significantly',
      'Cycle at 50-60 RPM',
      'Maintain for 2-5 minutes',
      'Recover with easy spinning',
      'Repeat 4-6 times',
    ],
    tips: 'This builds muscular strength. Be careful not to strain knees. Focus on powerful pedal strokes.',
  },
  {
    id: 37,
    name: 'Standing Climb',
    description: 'Cycling while standing to engage different muscles and improve power output.',
    muscleGroups: ['Legs', 'Glutes', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Increase resistance or find a hill',
      'Stand up on pedals',
      'Maintain for 30 seconds to 2 minutes',
      'Sit down and recover',
      'Repeat 4-8 times',
    ],
    tips: 'Use body weight to assist pedaling. This engages core and different leg muscles. Don\'t overdo it.',
  },
  {
    id: 38,
    name: 'Seated Power Efforts',
    description: 'High-intensity cycling while seated to build leg strength and maintain efficient form.',
    muscleGroups: ['Legs', 'Quads'],
    difficulty: 'Intermediate',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Increase resistance',
      'Remain seated',
      'Push hard for 1-3 minutes',
      'Focus on powerful pedal strokes',
      'Recover and repeat 4-6 times',
    ],
    tips: 'Staying seated builds specific leg strength. Focus on smooth, powerful revolutions.',
  },
  {
    id: 39,
    name: 'Long Slow Distance Ride',
    description: 'Extended duration cycling at easy pace to build aerobic endurance.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Beginner',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Cycle at easy, comfortable pace',
      'Maintain for 2-4 hours or longer',
      'Keep effort level low',
      'Stay hydrated and fueled',
      'Focus on consistent cadence',
    ],
    tips: 'This builds base fitness. Pace should feel very easy. Great for building mental toughness too.',
  },
  {
    id: 40,
    name: 'Recovery Ride',
    description: 'Very easy cycling to promote recovery and maintain fitness between hard workouts.',
    muscleGroups: ['Cardio', 'Legs'],
    difficulty: 'Beginner',
    equipment: 'Bicycle or stationary bike',
    instructions: [
      'Cycle at very easy pace',
      'Maintain for 30-60 minutes',
      'Keep effort minimal',
      'Focus on smooth pedaling',
      'Stay relaxed',
    ],
    tips: 'This should feel very easy. Active recovery helps flush lactic acid and promotes healing.',
  },
  // Strength for Cyclists
  {
    id: 41,
    name: 'Single-Leg Deadlift',
    description: 'Single-leg deadlift to improve balance, stability, and address muscle imbalances important for cycling.',
    muscleGroups: ['Hamstrings', 'Glutes', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Dumbbell or kettlebell (optional)',
    instructions: [
      'Stand on one leg',
      'Hinge at hip, extending other leg back',
      'Lower weight toward ground',
      'Keep back straight',
      'Return to standing',
      'Repeat 8-12 times per leg',
    ],
    tips: 'This improves single-leg strength and stability crucial for efficient pedaling. Start without weight.',
  },
  {
    id: 42,
    name: 'Goblet Squats',
    description: 'Squatting while holding weight at chest to build leg strength and improve cycling power.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
    difficulty: 'Beginner',
    equipment: 'Dumbbell or kettlebell',
    instructions: [
      'Hold weight at chest level',
      'Squat down keeping weight close',
      'Lower until thighs parallel to floor',
      'Push through heels to stand',
      'Repeat 12-15 times',
    ],
    tips: 'This builds leg strength for climbing and sprinting. Keep core engaged and back straight.',
  },
  {
    id: 43,
    name: 'Bulgarian Split Squats',
    description: 'Single-leg squat with rear foot elevated to build leg strength and address imbalances.',
    muscleGroups: ['Quadriceps', 'Glutes'],
    difficulty: 'Intermediate',
    equipment: 'Bench or step, dumbbells (optional)',
    instructions: [
      'Place rear foot on bench behind you',
      'Lower into lunge position',
      'Keep front knee behind toes',
      'Push through front heel to stand',
      'Repeat 10-12 times per leg',
    ],
    tips: 'This builds single-leg strength important for pedaling. Focus on front leg doing the work.',
  },
  {
    id: 44,
    name: 'Glute Bridges / Hip Thrusts',
    description: 'Lifting hips from ground to strengthen glutes, crucial for cycling power and injury prevention.',
    muscleGroups: ['Glutes', 'Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'None (or weight for hip thrusts)',
    instructions: [
      'Lie on back with knees bent',
      'Lift hips by squeezing glutes',
      'Hold for 2 seconds',
      'Lower with control',
      'Repeat 15-20 times',
    ],
    tips: 'Strong glutes are essential for cycling power. Focus on glute activation, not just lifting hips.',
  },
  {
    id: 45,
    name: 'Step-Ups',
    description: 'Stepping up onto platform to build leg strength and improve cycling power.',
    muscleGroups: ['Quadriceps', 'Glutes'],
    difficulty: 'Beginner',
    equipment: 'Step or bench, dumbbells (optional)',
    instructions: [
      'Step up onto platform with one foot',
      'Drive through heel to stand fully',
      'Step down with same leg',
      'Alternate legs',
      'Repeat 12-15 times per leg',
    ],
    tips: 'This mimics the pushing phase of pedaling. Focus on using the stepping leg, not pushing off with the trailing leg.',
  },
  // Mobility & Technique
  {
    id: 46,
    name: 'Hip Flexor Mobility Stretch',
    description: 'Stretching hip flexors to improve flexibility and prevent cycling-related tightness.',
    muscleGroups: ['Hip Flexors'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Kneel on one knee',
      'Push hips forward',
      'Feel stretch in front of hip',
      'Hold for 30-60 seconds',
      'Switch sides',
    ],
    tips: 'Tight hip flexors are common in cyclists. Regular stretching improves posture and prevents injury.',
  },
  {
    id: 47,
    name: 'Hamstring Mobility Flow',
    description: 'Dynamic hamstring stretches to improve flexibility and prevent tightness from cycling.',
    muscleGroups: ['Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Stand and hinge at hips',
      'Reach toward toes',
      'Feel stretch in hamstrings',
      'Hold for 30 seconds',
      'Return to standing',
      'Repeat 3-5 times',
    ],
    tips: 'Don\'t bounce. Hold stretch and breathe deeply. This helps prevent hamstring tightness from cycling.',
  },
  {
    id: 48,
    name: 'Ankle Mobility Drills',
    description: 'Exercises to improve ankle flexibility and range of motion for better pedaling mechanics.',
    muscleGroups: ['Ankles', 'Calves'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Sit with leg extended',
      'Point and flex foot',
      'Rotate ankle in circles',
      'Perform 10-15 repetitions',
      'Switch legs',
    ],
    tips: 'Good ankle mobility improves pedaling efficiency. Perform these regularly, especially after long rides.',
  },
  {
    id: 49,
    name: 'Core Planks (Front & Side)',
    description: 'Holding body in plank position to strengthen core, essential for cycling stability and power transfer.',
    muscleGroups: ['Core'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Front plank: Hold push-up position',
      'Side plank: Hold on side with arm extended',
      'Keep body straight',
      'Hold for 30-60 seconds',
      'Repeat 2-3 times each',
    ],
    tips: 'Strong core improves cycling efficiency and prevents lower back pain. Focus on maintaining straight line.',
  },
  {
    id: 50,
    name: 'Bird-Dog Stability Exercise',
    description: 'Extending opposite arm and leg to improve core stability and coordination.',
    muscleGroups: ['Core', 'Back'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Start on hands and knees',
      'Extend opposite arm and leg',
      'Hold for 5-10 seconds',
      'Return to start',
      'Switch sides',
      'Repeat 10-12 times per side',
    ],
    tips: 'This improves core stability important for cycling. Focus on keeping hips level and core engaged.',
  },
  // Swimming - Technique & Form Drills
  {
    id: 51,
    name: 'Freestyle Catch-Up Drill',
    description: 'Swimming freestyle with one arm waiting for the other to improve stroke timing and balance.',
    muscleGroups: ['Shoulders', 'Back', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Swim freestyle with one arm extended',
      'Wait for other arm to catch up',
      'Then begin next stroke',
      'Focus on long, smooth strokes',
      'Maintain body position',
    ],
    tips: 'This improves stroke timing and helps develop a longer, more efficient stroke. Focus on rotation.',
  },
  {
    id: 52,
    name: 'Finger-Tip Drag Drill',
    description: 'Dragging fingertips along water surface during recovery to improve arm position and reduce shoulder strain.',
    muscleGroups: ['Shoulders', 'Back'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Swim freestyle normally',
      'During arm recovery, drag fingertips along water',
      'Keep elbow high',
      'Focus on relaxed recovery',
      'Maintain body rotation',
    ],
    tips: 'This promotes high elbow recovery and reduces shoulder stress. Keep recovery arm relaxed.',
  },
  {
    id: 53,
    name: 'Kickboard Flutter Kick',
    description: 'Holding kickboard and kicking to isolate and strengthen leg muscles for swimming.',
    muscleGroups: ['Legs', 'Core'],
    difficulty: 'Beginner',
    equipment: 'Kickboard, pool',
    instructions: [
      'Hold kickboard with arms extended',
      'Kick with flutter kick motion',
      'Keep legs relatively straight',
      'Kick from hips, not knees',
      'Swim for 25-100 meters',
    ],
    tips: 'Strong kicking provides propulsion and helps maintain body position. Focus on small, fast kicks.',
  },
  {
    id: 54,
    name: 'Pull-Buoy Freestyle Pulls',
    description: 'Swimming freestyle with pull-buoy between legs to isolate and strengthen upper body.',
    muscleGroups: ['Shoulders', 'Back', 'Arms'],
    difficulty: 'Intermediate',
    equipment: 'Pull-buoy, pool',
    instructions: [
      'Place pull-buoy between thighs',
      'Swim freestyle using only arms',
      'Focus on powerful pull',
      'Maintain good body position',
      'Swim for 25-100 meters',
    ],
    tips: 'This builds upper body strength. Focus on catch and pull phases. Keep legs still.',
  },
  {
    id: 55,
    name: 'Sculling Drill (Front / Mid / Back)',
    description: 'Moving hands in figure-8 pattern to develop feel for water and improve propulsion.',
    muscleGroups: ['Shoulders', 'Arms'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Hold hands in front, mid, or back position',
      'Move hands in figure-8 pattern',
      'Feel pressure on palms',
      'Maintain body position',
      'Practice for 30-60 seconds each position',
    ],
    tips: 'This develops "feel for water" crucial for efficient swimming. Focus on feeling pressure on palms.',
  },
  {
    id: 56,
    name: 'One-Arm Freestyle Drill',
    description: 'Swimming freestyle with one arm to improve stroke mechanics and body rotation.',
    muscleGroups: ['Shoulders', 'Back', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Swim with one arm only',
      'Keep other arm extended forward',
      'Focus on rotation and pull',
      'Switch arms after each length',
      'Maintain body position',
    ],
    tips: 'This improves stroke mechanics and rotation. Focus on full body rotation with each stroke.',
  },
  {
    id: 57,
    name: 'Zipper Drill',
    description: 'Dragging thumb along body during recovery to promote high elbow and proper arm position.',
    muscleGroups: ['Shoulders', 'Back'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Swim freestyle normally',
      'During recovery, drag thumb along side',
      'Keep elbow high',
      'Focus on smooth recovery',
      'Maintain rotation',
    ],
    tips: 'This promotes proper recovery mechanics. Keep recovery arm close to body with high elbow.',
  },
  {
    id: 58,
    name: 'Breathing Bilateral Drill',
    description: 'Alternating breathing sides to improve balance, symmetry, and stroke efficiency.',
    muscleGroups: ['Shoulders', 'Back', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Breathe every 3 strokes (bilateral)',
      'Alternate breathing to left and right',
      'Focus on maintaining stroke rhythm',
      'Keep body balanced',
      'Practice for several lengths',
    ],
    tips: 'Bilateral breathing improves stroke symmetry and helps in open water. Start slowly and build rhythm.',
  },
  {
    id: 59,
    name: 'Side-Kicking Drill',
    description: 'Kicking on side to improve body position, rotation, and core stability.',
    muscleGroups: ['Core', 'Legs'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Lie on side in water',
      'Bottom arm extended forward',
      'Top arm at side',
      'Kick with flutter kick',
      'Switch sides after each length',
    ],
    tips: 'This improves body position and rotation awareness. Keep body straight and aligned.',
  },
  {
    id: 60,
    name: 'Streamline Push-Off + Glide',
    description: 'Pushing off wall in streamlined position to practice efficient body position and reduce drag.',
    muscleGroups: ['Core', 'Full Body'],
    difficulty: 'Beginner',
    equipment: 'Pool',
    instructions: [
      'Push off wall in streamline position',
      'Arms extended overhead, hands together',
      'Glide as far as possible',
      'Focus on reducing drag',
      'Repeat multiple times',
    ],
    tips: 'Good streamline reduces drag significantly. Practice tight streamline position and long glides.',
  },
  // Swimming - Stroke-Specific Workouts
  {
    id: 61,
    name: 'Freestyle Interval Sets',
    description: 'Structured freestyle swimming intervals to improve speed, endurance, and cardiovascular fitness.',
    muscleGroups: ['Full Body', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Warm up with easy swimming',
      'Swim hard for 50-200 meters',
      'Rest for 15-60 seconds',
      'Repeat 4-10 times',
      'Cool down with easy swimming',
    ],
    tips: 'Interval training improves speed and endurance. Focus on maintaining good form even when tired.',
  },
  {
    id: 62,
    name: 'Backstroke Laps',
    description: 'Swimming backstroke to work different muscle groups and improve overall swimming ability.',
    muscleGroups: ['Shoulders', 'Back', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Pool',
    instructions: [
      'Swim backstroke for multiple lengths',
      'Focus on arm rotation and kick',
      'Maintain straight body position',
      'Keep head still, looking up',
      'Practice for 200-800 meters',
    ],
    tips: 'Backstroke provides variety and works different muscles. Focus on continuous arm movement and steady kick.',
  },
  {
    id: 63,
    name: 'Breaststroke Kick Sets',
    description: 'Isolated breaststroke kicking to strengthen legs and improve kick technique.',
    muscleGroups: ['Legs', 'Glutes', 'Inner Thighs'],
    difficulty: 'Beginner',
    equipment: 'Kickboard, pool',
    instructions: [
      'Hold kickboard with arms extended',
      'Perform breaststroke kick',
      'Focus on proper kick mechanics',
      'Keep knees close together',
      'Swim for 25-100 meters',
    ],
    tips: 'Breaststroke kick is powerful but technique-dependent. Focus on proper timing and mechanics.',
  },
  {
    id: 64,
    name: 'Butterfly Body Wave Drill',
    description: 'Practicing the undulating body movement of butterfly stroke without full arm movement.',
    muscleGroups: ['Core', 'Back'],
    difficulty: 'Advanced',
    equipment: 'Pool',
    instructions: [
      'Swim with arms at sides',
      'Create undulating body wave',
      'Initiate movement from chest',
      'Transfer wave through body',
      'Practice for 25-50 meters',
    ],
    tips: 'Butterfly requires strong core and proper body wave. Start with small movements and build up.',
  },
  {
    id: 65,
    name: 'Underwater Dolphin Kicks',
    description: 'Performing dolphin kicks underwater to improve core strength and streamline position.',
    muscleGroups: ['Core', 'Legs'],
    difficulty: 'Intermediate',
    equipment: 'Pool, fins (optional)',
    instructions: [
      'Push off wall in streamline',
      'Perform dolphin kicks underwater',
      'Stay streamlined',
      'Surface before running out of breath',
      'Repeat multiple times',
    ],
    tips: 'Strong dolphin kicks are crucial for starts and turns. Practice breath control and streamline position.',
  },
  // Swimming - Strength & Conditioning
  {
    id: 66,
    name: 'Wall Kicks (Vertical Kicking)',
    description: 'Kicking vertically in deep water to build leg strength and improve kick efficiency.',
    muscleGroups: ['Legs', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Pool (deep water)',
    instructions: [
      'Tread water in deep end',
      'Hold onto wall or use arms for support',
      'Kick with flutter or dolphin kick',
      'Maintain vertical position',
      'Continue for 30-60 seconds',
    ],
    tips: 'This builds leg strength and kick power. Focus on quick, efficient kicks from hips.',
  },
  {
    id: 67,
    name: 'Treading Water (Eggbeater Kick)',
    description: 'Maintaining vertical position in water using alternating leg movements to build endurance and leg strength.',
    muscleGroups: ['Legs', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Pool (deep water)',
    instructions: [
      'Stay vertical in deep water',
      'Use eggbeater kick (alternating circular motions)',
      'Keep head above water',
      'Use arms minimally or not at all',
      'Continue for 1-5 minutes',
    ],
    tips: 'This builds leg endurance and water confidence. Focus on efficient, continuous leg movement.',
  },
  {
    id: 68,
    name: 'Water Resistance Walking/Running',
    description: 'Walking or running in shallow water to add resistance and build strength with low impact.',
    muscleGroups: ['Legs', 'Cardio'],
    difficulty: 'Beginner',
    equipment: 'Pool (shallow water)',
    instructions: [
      'Walk or run in waist-deep water',
      'Maintain normal walking/running motion',
      'Water provides natural resistance',
      'Continue for 10-20 minutes',
      'Focus on good form',
    ],
    tips: 'Water provides excellent resistance with minimal impact. Great for recovery or cross-training.',
  },
  {
    id: 69,
    name: 'Aqua Pull-Downs with Resistance Bands',
    description: 'Performing pull-downs in water with resistance bands to strengthen swimming muscles.',
    muscleGroups: ['Shoulders', 'Back', 'Arms'],
    difficulty: 'Intermediate',
    equipment: 'Resistance bands, pool',
    instructions: [
      'Stand in water with band overhead',
      'Pull band down to sides',
      'Mimic swimming pull motion',
      'Control the resistance',
      'Repeat 12-15 times',
    ],
    tips: 'This builds strength specific to swimming. Focus on proper pull mechanics and controlled movement.',
  },
  {
    id: 70,
    name: 'Dryland Core Work (Planks, Hollow Holds)',
    description: 'Core strengthening exercises on land to improve swimming power and body position.',
    muscleGroups: ['Core'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Plank: Hold push-up position for 30-60 seconds',
      'Hollow hold: Lie on back, lift shoulders and legs, hold',
      'Perform 2-3 sets of each',
      'Focus on core engagement',
    ],
    tips: 'Strong core is essential for efficient swimming. These exercises improve body position and power transfer.',
  },
  // Upper Body – Push
  {
    id: 71,
    name: 'Bench Press',
    description: 'Lying on bench and pressing weight upward to build chest, shoulder, and triceps strength.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Intermediate',
    equipment: 'Barbell or dumbbells, bench',
    instructions: [
      'Lie on bench with feet flat',
      'Grip bar slightly wider than shoulders',
      'Lower bar to chest with control',
      'Press bar up until arms extended',
      'Repeat 8-12 times',
    ],
    tips: 'Use a spotter for safety. Don\'t bounce bar off chest. Keep shoulder blades retracted.',
  },
  {
    id: 72,
    name: 'Incline Dumbbell Press',
    description: 'Pressing dumbbells upward on inclined bench to target upper chest and shoulders.',
    muscleGroups: ['Upper Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Intermediate',
    equipment: 'Dumbbells, incline bench',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Hold dumbbells at chest level',
      'Press upward until arms extended',
      'Lower with control',
      'Repeat 10-12 times',
    ],
    tips: 'Incline targets upper chest. Control the weight throughout the movement. Don\'t arch excessively.',
  },
  {
    id: 73,
    name: 'Overhead Shoulder Press',
    description: 'Pressing weight overhead to build shoulder and triceps strength.',
    muscleGroups: ['Shoulders', 'Triceps', 'Core'],
    difficulty: 'Intermediate',
    equipment: 'Barbell or dumbbells',
    instructions: [
      'Stand or sit with weight at shoulder height',
      'Press weight overhead',
      'Keep core engaged',
      'Lower with control',
      'Repeat 8-12 times',
    ],
    tips: 'Keep core tight to protect lower back. Don\'t arch excessively. Focus on smooth, controlled movement.',
  },
  {
    id: 74,
    name: 'Dips',
    description: 'Lowering and raising body using parallel bars to build triceps and chest strength.',
    muscleGroups: ['Triceps', 'Chest', 'Shoulders'],
    difficulty: 'Intermediate',
    equipment: 'Parallel bars or dip station',
    instructions: [
      'Support body on parallel bars',
      'Lower body by bending arms',
      'Go down until shoulders below elbows',
      'Push up to starting position',
      'Repeat 8-15 times',
    ],
    tips: 'Keep body upright for triceps focus, lean forward for chest. Start with assisted dips if needed.',
  },
  {
    id: 75,
    name: 'Push-Ups',
    description: 'Classic bodyweight exercise pushing body up from ground to build chest, shoulders, and triceps.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Start in plank position',
      'Lower body until chest nearly touches ground',
      'Push back up to starting position',
      'Keep body straight',
      'Repeat 10-20 times',
    ],
    tips: 'Keep core engaged and body in straight line. Modify by doing on knees if needed.',
  },
  {
    id: 76,
    name: 'Chest Fly (Dumbbell or Cable)',
    description: 'Opening arms wide with weights to isolate and strengthen chest muscles.',
    muscleGroups: ['Chest'],
    difficulty: 'Intermediate',
    equipment: 'Dumbbells or cable machine',
    instructions: [
      'Lie on bench or stand with cables',
      'Start with arms extended',
      'Lower weights in wide arc',
      'Feel stretch in chest',
      'Bring arms together',
      'Repeat 10-12 times',
    ],
    tips: 'Control the movement. Don\'t go too wide to avoid shoulder strain. Focus on chest contraction.',
  },
  // Upper Body – Pull
  {
    id: 77,
    name: 'Pull-Ups / Chin-Ups',
    description: 'Pulling body up to bar to build back and biceps strength.',
    muscleGroups: ['Back', 'Biceps', 'Shoulders'],
    difficulty: 'Intermediate',
    equipment: 'Pull-up bar',
    instructions: [
      'Hang from bar with palms away (pull-ups) or toward you (chin-ups)',
      'Pull body up until chin above bar',
      'Lower with control',
      'Repeat 5-15 times',
    ],
    tips: 'Start with assisted pull-ups if needed. Focus on full range of motion. Engage core throughout.',
  },
  {
    id: 78,
    name: 'Lat Pulldown',
    description: 'Pulling bar down to chest while seated to build back and biceps strength.',
    muscleGroups: ['Back', 'Biceps'],
    difficulty: 'Beginner',
    equipment: 'Cable machine',
    instructions: [
      'Sit at lat pulldown machine',
      'Grip bar wider than shoulders',
      'Pull bar to upper chest',
      'Control the weight up',
      'Repeat 10-12 times',
    ],
    tips: 'Keep torso upright. Focus on pulling with back muscles, not just arms. Control the negative.',
  },
  {
    id: 79,
    name: 'Barbell Row',
    description: 'Rowing barbell toward body to build back, biceps, and rear deltoids.',
    muscleGroups: ['Back', 'Biceps', 'Rear Delts'],
    difficulty: 'Intermediate',
    equipment: 'Barbell',
    instructions: [
      'Bend at hips with slight knee bend',
      'Hold bar with overhand grip',
      'Pull bar to lower chest/upper abdomen',
      'Squeeze shoulder blades together',
      'Lower with control',
      'Repeat 8-12 times',
    ],
    tips: 'Keep back straight. Don\'t use momentum. Focus on pulling with back muscles.',
  },
  {
    id: 80,
    name: 'Seated Cable Row',
    description: 'Rowing cable handle while seated to build back and biceps with controlled movement.',
    muscleGroups: ['Back', 'Biceps'],
    difficulty: 'Beginner',
    equipment: 'Cable machine',
    instructions: [
      'Sit with feet on platform',
      'Pull handle to torso',
      'Squeeze shoulder blades',
      'Control the return',
      'Repeat 10-12 times',
    ],
    tips: 'Keep torso upright. Don\'t lean back excessively. Focus on back contraction, not just arm pull.',
  },
  {
    id: 81,
    name: 'Face Pulls',
    description: 'Pulling cable rope toward face to strengthen rear deltoids and improve posture.',
    muscleGroups: ['Rear Delts', 'Back'],
    difficulty: 'Beginner',
    equipment: 'Cable machine',
    instructions: [
      'Set cable at face height',
      'Pull rope toward face',
      'Separate handles at end',
      'Squeeze rear delts',
      'Control the return',
      'Repeat 12-15 times',
    ],
    tips: 'This improves posture and shoulder health. Focus on rear delt contraction. Don\'t use too much weight.',
  },
  {
    id: 82,
    name: 'Biceps Barbell Curl',
    description: 'Curling barbell upward to build biceps strength and size.',
    muscleGroups: ['Biceps'],
    difficulty: 'Beginner',
    equipment: 'Barbell',
    instructions: [
      'Stand holding barbell with underhand grip',
      'Curl bar toward shoulders',
      'Squeeze biceps at top',
      'Lower with control',
      'Repeat 10-12 times',
    ],
    tips: 'Keep elbows stationary. Don\'t swing the weight. Focus on biceps doing the work.',
  },
  {
    id: 83,
    name: 'Hammer Curls',
    description: 'Curling dumbbells with neutral grip to target biceps and brachialis.',
    muscleGroups: ['Biceps', 'Brachialis'],
    difficulty: 'Beginner',
    equipment: 'Dumbbells',
    instructions: [
      'Hold dumbbells with neutral grip (palms facing each other)',
      'Curl weights toward shoulders',
      'Keep elbows stationary',
      'Lower with control',
      'Repeat 10-12 times',
    ],
    tips: 'Neutral grip targets different part of biceps. Can be done standing or seated. Control the movement.',
  },
  {
    id: 84,
    name: 'Preacher Curls',
    description: 'Curling weight on preacher bench to isolate biceps with controlled movement.',
    muscleGroups: ['Biceps'],
    difficulty: 'Intermediate',
    equipment: 'Preacher bench, barbell or dumbbells',
    instructions: [
      'Rest arms on preacher bench',
      'Curl weight upward',
      'Lower slowly and fully',
      'Feel stretch at bottom',
      'Repeat 10-12 times',
    ],
    tips: 'This isolates biceps effectively. Don\'t go too heavy. Focus on full range of motion.',
  },
  // Legs
  {
    id: 85,
    name: 'Back Squat',
    description: 'Squatting with barbell on upper back to build leg and glute strength.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'Intermediate',
    equipment: 'Barbell, squat rack',
    instructions: [
      'Place bar on upper back',
      'Squat down until thighs parallel',
      'Keep knees behind toes',
      'Push through heels to stand',
      'Repeat 8-12 times',
    ],
    tips: 'Use proper form and safety equipment. Keep core engaged. Don\'t let knees cave inward.',
  },
  {
    id: 86,
    name: 'Front Squat',
    description: 'Squatting with barbell in front to target quadriceps with emphasis on core strength.',
    muscleGroups: ['Quadriceps', 'Core', 'Glutes'],
    difficulty: 'Advanced',
    equipment: 'Barbell, squat rack',
    instructions: [
      'Hold bar in front at shoulder height',
      'Squat down keeping torso upright',
      'Lower until thighs parallel',
      'Push through heels to stand',
      'Repeat 8-12 times',
    ],
    tips: 'Requires good mobility. Keep torso upright. This emphasizes quads and core more than back squat.',
  },
  {
    id: 87,
    name: 'Leg Press',
    description: 'Pressing weight with legs on machine to build leg strength with reduced spinal load.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'Leg press machine',
    instructions: [
      'Sit in leg press machine',
      'Place feet on platform',
      'Lower weight by bending knees',
      'Press weight up until legs extended',
      'Repeat 12-15 times',
    ],
    tips: 'Don\'t lock knees at top. Keep feet flat. This is safer for back than free-weight squats.',
  },
  {
    id: 88,
    name: 'Romanian Deadlift (RDL)',
    description: 'Hinging at hips with weight to target hamstrings and glutes while maintaining straight legs.',
    muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
    difficulty: 'Intermediate',
    equipment: 'Barbell or dumbbells',
    instructions: [
      'Hold weight with arms extended',
      'Hinge at hips, pushing them back',
      'Lower weight while keeping legs relatively straight',
      'Feel stretch in hamstrings',
      'Return by squeezing glutes',
      'Repeat 10-12 times',
    ],
    tips: 'Keep back straight. Don\'t round your back. Focus on hip hinge, not squatting.',
  },
  {
    id: 90,
    name: 'Calf Raises',
    description: 'Rising onto toes to strengthen calves, important for running, jumping, and overall leg strength.',
    muscleGroups: ['Calves'],
    difficulty: 'Beginner',
    equipment: 'None (or machine/weights for added resistance)',
    instructions: [
      'Stand with feet hip-width apart',
      'Rise up onto toes',
      'Hold for 1-2 seconds',
      'Lower slowly',
      'Repeat 15-25 times',
    ],
    tips: 'Strong calves support many activities. Can be done on floor or with toes on step for greater range. Add weight for progression.',
  },
  {
    id: 91,
    name: 'Hip Thrusts / Glute Bridges',
    description: 'Lifting hips from ground to strengthen glutes, crucial for lower body power and injury prevention.',
    muscleGroups: ['Glutes', 'Hamstrings'],
    difficulty: 'Beginner',
    equipment: 'None (or weight/barbell for added resistance)',
    instructions: [
      'Lie on back with knees bent',
      'Lift hips by squeezing glutes',
      'Hold for 2 seconds at top',
      'Lower with control',
      'Repeat 15-20 times',
    ],
    tips: 'Strong glutes are essential for athletic performance. Focus on glute activation, not just lifting. Add weight for progression.',
  },
  // Core
  {
    id: 92,
    name: 'Plank',
    description: 'Holding body in straight line to strengthen entire core and improve stability.',
    muscleGroups: ['Core'],
    difficulty: 'Beginner',
    equipment: 'None',
    instructions: [
      'Start in push-up position',
      'Lower to forearms',
      'Keep body in straight line',
      'Hold position',
      'Maintain for 30-60 seconds',
    ],
    tips: 'Don\'t let hips sag or rise. Breathe normally. Start with shorter holds and build up. Strong core supports all movements.',
  },
  {
    id: 93,
    name: 'Hanging Leg Raises',
    description: 'Raising legs while hanging from bar to strengthen lower abs and hip flexors.',
    muscleGroups: ['Core', 'Hip Flexors'],
    difficulty: 'Advanced',
    equipment: 'Pull-up bar',
    instructions: [
      'Hang from pull-up bar',
      'Raise legs toward chest',
      'Keep legs straight or bent',
      'Lower with control',
      'Repeat 10-15 times',
    ],
    tips: 'Requires grip and core strength. Start with bent knees if needed. Focus on controlled movement, not swinging.',
  },
  {
    id: 94,
    name: 'Cable Woodchoppers',
    description: 'Rotating and pulling cable across body to strengthen core and improve rotational power.',
    muscleGroups: ['Core', 'Obliques'],
    difficulty: 'Intermediate',
    equipment: 'Cable machine',
    instructions: [
      'Set cable at high position',
      'Pull cable diagonally across body',
      'Rotate torso',
      'Control the return',
      'Repeat 10-12 times per side',
    ],
    tips: 'This builds rotational strength important for many sports. Focus on core rotation, not just arm pull.',
  },
  {
    id: 95,
    name: 'Russian Twists',
    description: 'Rotating torso while seated to strengthen core and obliques.',
    muscleGroups: ['Core', 'Obliques'],
    difficulty: 'Beginner',
    equipment: 'None (or weight for added resistance)',
    instructions: [
      'Sit with knees bent, lean back slightly',
      'Rotate torso side to side',
      'Keep core engaged',
      'Add weight for progression',
      'Repeat 20-30 times total',
    ],
    tips: 'Focus on rotation from core, not just arms. Keep back straight. Can be done with or without weight.',
  },
  // Full Body / Compound
  {
    id: 96,
    name: 'Deadlift',
    description: 'Lifting weight from ground to standing to build full-body strength, especially back, glutes, and hamstrings.',
    muscleGroups: ['Back', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'Advanced',
    equipment: 'Barbell and weights',
    instructions: [
      'Stand with feet hip-width, bar over mid-foot',
      'Bend at hips and knees to grip bar',
      'Keep back straight, chest up',
      'Drive through heels to lift bar',
      'Stand tall with shoulders back',
      'Lower by pushing hips back',
      'Repeat 5-8 times',
    ],
    tips: 'Maintain neutral spine throughout. This is a complex movement - learn proper form before going heavy. Consider professional instruction.',
  },
  {
    id: 97,
    name: 'Clean and Press',
    description: 'Explosive movement lifting weight from ground to overhead in one fluid motion to build full-body power.',
    muscleGroups: ['Full Body', 'Legs', 'Shoulders'],
    difficulty: 'Advanced',
    equipment: 'Barbell or dumbbells',
    instructions: [
      'Start with weight on ground',
      'Explosively lift to shoulders (clean)',
      'Immediately press overhead',
      'Lower with control',
      'Repeat 3-6 times',
    ],
    tips: 'This is an advanced Olympic lift. Requires proper technique and mobility. Consider professional coaching before attempting.',
  },
  {
    id: 98,
    name: 'Kettlebell Swings',
    description: 'Swinging kettlebell from between legs to chest height to build explosive hip power and full-body conditioning.',
    muscleGroups: ['Glutes', 'Hamstrings', 'Core', 'Shoulders'],
    difficulty: 'Intermediate',
    equipment: 'Kettlebell',
    instructions: [
      'Stand with feet wider than shoulders',
      'Swing kettlebell from between legs',
      'Drive with hips, not arms',
      'Swing to chest height',
      'Let it swing back down',
      'Repeat 15-25 times',
    ],
    tips: 'This is a hip-dominant movement. Drive with hips, not by pulling with arms. Keep core engaged throughout.',
  },
  {
    id: 99,
    name: 'Farmer\'s Carry',
    description: 'Carrying heavy weights while walking to build grip strength, core stability, and full-body endurance.',
    muscleGroups: ['Full Body', 'Core', 'Grip'],
    difficulty: 'Intermediate',
    equipment: 'Heavy dumbbells or kettlebells',
    instructions: [
      'Pick up heavy weights in each hand',
      'Walk forward maintaining good posture',
      'Keep core engaged',
      'Walk for 20-50 meters',
      'Set weights down and rest',
    ],
    tips: 'This builds functional strength and grip. Start with lighter weights. Focus on maintaining posture, not speed.',
  },
  {
    id: 100,
    name: 'Burpees',
    description: 'Full-body exercise combining squat, push-up, and jump to build strength, power, and cardiovascular fitness.',
    muscleGroups: ['Full Body', 'Cardio'],
    difficulty: 'Intermediate',
    equipment: 'None',
    instructions: [
      'Start standing',
      'Squat down and place hands on floor',
      'Jump feet back into plank',
      'Do a push-up (optional)',
      'Jump feet forward',
      'Explode up with arms overhead',
      'Repeat 10-20 times',
    ],
    tips: 'This is intense full-body conditioning. Start slowly to perfect form. Modify by stepping instead of jumping if needed.',
  },
];

type TabType = 'glossary' | 'exercises';

export default function GlossaryPage() {
  // URL search params for exercise linking
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedExerciseRef = useRef<HTMLDivElement>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('glossary');
  
  // Glossary state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExerciseItem, setSelectedExerciseItem] = useState<GlossaryExercise | null>(null);
  const [highlightedExerciseId, setHighlightedExerciseId] = useState<number | null>(null);

  // Exercise database state
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Filter glossary exercises
  const filteredExercises = useMemo(() => {
    return glossaryExercises
      .filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exercise.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            exercise.equipment?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || exercise.difficulty === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, selectedCategory]);

  // Load rate limit status when tab changes
  useEffect(() => {
    if (activeTab === 'exercises') {
      loadRateLimitStatus();
    }
  }, [activeTab]);

  const loadRateLimitStatus = async () => {
    try {
      const status = await getRateLimitStatus();
      setRateLimitStatus(status);
    } catch (error) {
      console.error('Failed to load rate limit status:', error);
    }
  };

  const handleExerciseSearch = async () => {
    if (!exerciseSearchTerm.trim()) {
      setExerciseError('Please enter a search term');
      return;
    }

    setIsLoadingExercises(true);
    setExerciseError(null);
    setHasSearched(true);

    try {
      const response = await searchExercises({
        name: exerciseSearchTerm,
        limit: 20
      });
      
      setExercises(response.data);
      setRateLimitStatus({
        requests_made: response.rate_limit.remaining_requests,
        requests_remaining: response.rate_limit.remaining_requests,
        limit: 5,
        reset_in_seconds: response.rate_limit.reset_in_seconds,
        period_hours: 1
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setExerciseError(error.message || 'Failed to search exercises. Please try again.');
      setExercises([]);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const handleSearch = (searchValue: string) => {
    console.log('Searching for:', searchValue);
  };

  const formatResetTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseDetail(null); // Reset detail view
    setDetailError(null);
  };

  const closeModal = () => {
    setSelectedExercise(null);
    setExerciseDetail(null);
    setDetailError(null);
  };

  const handleViewFullDetails = async () => {
    if (!selectedExercise) return;

    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const response = await getExerciseDetail(selectedExercise.exerciseId);
      setExerciseDetail(response.data);
      setRateLimitStatus({
        requests_made: response.rate_limit.remaining_requests,
        requests_remaining: response.rate_limit.remaining_requests,
        limit: 5,
        reset_in_seconds: response.rate_limit.reset_in_seconds,
        period_hours: 1
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setDetailError(error.message || 'Failed to load full details. Please try again.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Handle keyboard events (ESC to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedExercise) {
        closeModal();
        }
        if (selectedExerciseItem) {
          setSelectedExerciseItem(null);
        }
      }
    };

    if (selectedExercise || selectedExerciseItem) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedExercise, selectedExerciseItem]);

  // Handle exercise parameter from URL (for linking from chat)
  useEffect(() => {
    const exerciseName = searchParams.get('exercise');
    if (exerciseName) {
      // Switch to glossary tab
      setActiveTab('glossary');
      
      // Find the exercise by name (case-insensitive)
      const foundExercise = glossaryExercises.find(
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (foundExercise) {
        // Highlight the exercise
        setHighlightedExerciseId(foundExercise.id);
        
        // Small delay to allow rendering, then scroll and open
        setTimeout(() => {
          if (highlightedExerciseRef.current) {
            highlightedExerciseRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
          
          // Auto-open the exercise modal
          setTimeout(() => {
            setSelectedExerciseItem(foundExercise);
            
            // Remove the highlight after opening modal
            setTimeout(() => {
              setHighlightedExerciseId(null);
              // Clear the URL parameter
              setSearchParams({});
            }, 1000);
          }, 500);
        }, 100);
      }
    }
  }, [searchParams, setSearchParams]);

  return (
    <Layout onSearch={handleSearch}>
      <div className="glossary-content">
        <section className="glossary-hero">
          <h1>Fitness Knowledge Hub</h1>
          <p>Explore 100+ exercises with detailed instructions and discover more from our live database</p>
        </section>

        {/* Tabs Navigation */}
        <div className="glossary-tabs">
          <button
            className={`glossary-tab ${activeTab === 'glossary' ? 'active' : ''}`}
            onClick={() => setActiveTab('glossary')}
          >
            Exercise Library
          </button>
          <button
            className={`glossary-tab ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercises')}
          >
            Exercise Database
          </button>
        </div>

        {/* Glossary Tab Content */}
        {activeTab === 'glossary' && (
          <>
            <section className="glossary-controls">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search exercises by name, muscle group, or equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glossary-search"
                />
              </div>

              <div className="category-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                    <span className="category-count">
                      {category === 'All'
                        ? glossaryExercises.length
                        : glossaryExercises.filter(e => e.difficulty === category).length}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="glossary-results">
              {filteredExercises.length > 0 ? (
                <>
                  <div className="results-count">
                    Showing {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'}
                  </div>
                  <div className="terms-grid">
                    {filteredExercises.map((item) => (
                      <div 
                        key={item.id} 
                        ref={highlightedExerciseId === item.id ? highlightedExerciseRef : null}
                        className={`term-card exercise-card-item ${highlightedExerciseId === item.id ? 'exercise-highlighted' : ''}`}
                        onClick={() => setSelectedExerciseItem(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="term-header">
                          <h3 className="term-title">{item.name}</h3>
                          <span className={`category-badge difficulty-${item.difficulty.toLowerCase()}`}>
                            {item.difficulty}
                          </span>
                        </div>
                        <p className="term-definition">{item.description}</p>
                        <div className="muscle-groups-tags">
                          {item.muscleGroups.map((muscle, idx) => (
                            <span key={idx} className="muscle-tag-small">
                              {muscle}
                            </span>
                          ))}
                        </div>
                        {item.equipment && (
                          <p className="equipment-text">
                            <strong>Equipment:</strong> {item.equipment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-results">
                  <h3>No exercises found</h3>
                  <p>Try adjusting your search or filter to find what you're looking for.</p>
                </div>
              )}
            </section>

            {/* Exercise Detail Modal for Glossary Exercises */}
            {selectedExerciseItem && (
              <div className="exercise-modal-backdrop" onClick={() => setSelectedExerciseItem(null)}>
                <div className="exercise-modal glossary-exercise-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={() => setSelectedExerciseItem(null)}>×</button>
                  
                  <div className="modal-content">
                    <div className="modal-details-section" style={{ width: '100%' }}>
                      <h2 className="modal-exercise-title">{selectedExerciseItem.name}</h2>
                      
                      <div className="modal-detail-group">
                        <h3 className="modal-detail-title">Difficulty Level</h3>
                        <div className="modal-badges">
                          <span className={`modal-badge difficulty-badge-${selectedExerciseItem.difficulty.toLowerCase()}`}>
                            {selectedExerciseItem.difficulty}
                          </span>
                        </div>
                      </div>

                      <div className="modal-detail-group highlight-section">
                        <h3 className="modal-detail-title">Description</h3>
                        <p className="modal-overview">{selectedExerciseItem.description}</p>
                      </div>

                      <div className="modal-detail-group">
                        <h3 className="modal-detail-title">Target Muscle Groups</h3>
                        <div className="modal-badges">
                          {selectedExerciseItem.muscleGroups.map((muscle, idx) => (
                            <span key={idx} className="modal-badge muscle-badge">
                              {muscle}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedExerciseItem.equipment && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">Required Equipment</h3>
                          <div className="modal-badges">
                            <span className="modal-badge equipment-badge">
                              {selectedExerciseItem.equipment}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedExerciseItem.instructions && selectedExerciseItem.instructions.length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">Step-by-Step Instructions</h3>
                          <ol className="modal-instructions-list">
                            {selectedExerciseItem.instructions.map((instruction, idx) => (
                              <li key={idx} className="modal-instruction-item">
                                {instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {selectedExerciseItem.tips && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">Pro Tips & Safety</h3>
                          <div className="tips-box">
                            <p className="tips-text">{selectedExerciseItem.tips}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Exercise Database Tab Content */}
        {activeTab === 'exercises' && (
          <div className="exercise-db-container">
            {/* Rate Limit Info */}
            {rateLimitStatus && (
              <div className={`rate-limit-info ${rateLimitStatus.requests_remaining <= 1 ? 'low-requests' : ''}`}>
                <div className="rate-limit-text">
                  <h3>
                    {rateLimitStatus.requests_remaining} of {rateLimitStatus.limit} requests remaining
                  </h3>
                  <p>
                    Resets in {formatResetTime(rateLimitStatus.reset_in_seconds)}. 
                    Search limit: {rateLimitStatus.limit} requests per hour to conserve API usage.
                  </p>
                </div>
              </div>
            )}

            {/* Search Section */}
            <section className="glossary-controls">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search for exercises (e.g., 'bench press', 'squat', 'deadlift')..."
                  value={exerciseSearchTerm}
                  onChange={(e) => setExerciseSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleExerciseSearch()}
                  className="glossary-search"
                />
                <button
                  onClick={handleExerciseSearch}
                  disabled={isLoadingExercises || !exerciseSearchTerm.trim()}
                  style={{
                    marginTop: '12px',
                    padding: '14px 32px',
                    background: '#800000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isLoadingExercises ? 'not-allowed' : 'pointer',
                    opacity: isLoadingExercises || !exerciseSearchTerm.trim() ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                >
                  {isLoadingExercises ? 'Searching...' : 'Search Exercises'}
                </button>
              </div>
            </section>

            {/* Error Message */}
            {exerciseError && (
              <div className="error-message">
                <h3>Error</h3>
                <p>{exerciseError}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoadingExercises && (
              <div>
                <div className="spinner"></div>
              </div>
            )}

            {/* Results */}
            {!isLoadingExercises && hasSearched && exercises.length > 0 && (
              <section className="glossary-results">
                <div className="results-count">
                  Found {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                </div>
                <div className="exercise-grid">
                  {exercises.map((exercise) => (
                    <div 
                      key={exercise.exerciseId} 
                      className="exercise-card-simple"
                      onClick={() => handleExerciseClick(exercise)}
                    >
                      <div className="exercise-thumbnail">
                        <img 
                          src={exercise.imageUrl} 
                          alt={exercise.name}
                          className="exercise-thumbnail-image"
                          loading="lazy"
                        />
                        <div className="exercise-overlay">
                          <span className="view-details-btn">View Details</span>
                        </div>
                      </div>
                      <div className="exercise-card-footer">
                        <h3 className="exercise-name-simple">{exercise.name}</h3>
                        <span className="exercise-type-badge">{exercise.exerciseType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Exercise Detail Modal */}
            {selectedExercise && (
              <div className="exercise-modal-backdrop" onClick={closeModal}>
                <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={closeModal}>×</button>
                  
                  <div className="modal-content">
                    <div className="modal-image-section">
                      <img 
                        src={exerciseDetail?.imageUrl || selectedExercise.imageUrl} 
                        alt={selectedExercise.name}
                        className="modal-exercise-image"
                      />
                    </div>
                    
                    <div className="modal-details-section">
                      <h2 className="modal-exercise-title">{selectedExercise.name}</h2>
                      <p className="modal-exercise-id">ID: {selectedExercise.exerciseId}</p>

                      {/* View Full Details Button */}
                      {!exerciseDetail && !isLoadingDetail && (
                        <button 
                          className="view-full-details-btn"
                          onClick={handleViewFullDetails}
                        >
                          View Full Details
                          <span className="btn-hint">(Uses 1 request)</span>
                        </button>
                      )}

                      {/* Loading Detail State */}
                      {isLoadingDetail && (
                        <div>
                          <div className="small-spinner"></div>
                        </div>
                      )}

                      {/* Detail Error */}
                      {detailError && (
                        <div className="detail-error">
                          {detailError}
                        </div>
                      )}

                      {/* Overview Section (only in detailed view) */}
                      {exerciseDetail?.overview && (
                        <div className="modal-detail-group highlight-section">
                          <h3 className="modal-detail-title">
                            Overview
                          </h3>
                          <p className="modal-overview">{exerciseDetail.overview}</p>
                        </div>
                      )}

                      <div className="modal-detail-group">
                        <h3 className="modal-detail-title">
                          Exercise Type
                        </h3>
                        <div className="modal-badges">
                          <span className="modal-badge type-badge">
                            {selectedExercise.exerciseType}
                          </span>
                        </div>
                      </div>

                      <div className="modal-detail-group">
                        <h3 className="modal-detail-title">
                          Target Body Parts
                        </h3>
                        <div className="modal-badges">
                          {selectedExercise.bodyParts.length > 0 ? (
                            selectedExercise.bodyParts.map((part, idx) => (
                              <span key={idx} className="modal-badge body-part-badge">
                                {part}
                              </span>
                            ))
                          ) : (
                            <span className="modal-empty">Not specified</span>
                          )}
                        </div>
                      </div>

                      <div className="modal-detail-group">
                        <h3 className="modal-detail-title">
                          Required Equipment
                        </h3>
                        <div className="modal-badges">
                          {selectedExercise.equipments.length > 0 ? (
                            selectedExercise.equipments.map((equip, idx) => (
                              <span key={idx} className="modal-badge equipment-badge">
                                {equip}
                              </span>
                            ))
                          ) : (
                            <span className="modal-empty">No equipment needed</span>
                          )}
                        </div>
                      </div>

                      {selectedExercise.targetMuscles && selectedExercise.targetMuscles.length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Primary Target Muscles
                          </h3>
                          <div className="modal-badges">
                            {selectedExercise.targetMuscles.map((muscle, idx) => (
                              <span key={idx} className="modal-badge muscle-badge">
                                {muscle}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Secondary Muscles
                          </h3>
                          <div className="modal-badges">
                            {selectedExercise.secondaryMuscles.map((muscle, idx) => (
                              <span key={idx} className="modal-badge secondary-muscle-badge">
                                {muscle}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(exerciseDetail?.keywords || selectedExercise.keywords) && (exerciseDetail?.keywords || selectedExercise.keywords).length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Keywords & Tags
                          </h3>
                          <div className="modal-keywords">
                            {(exerciseDetail?.keywords || selectedExercise.keywords).slice(0, 6).map((keyword, idx) => (
                              <span key={idx} className="modal-keyword">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instructions Section (only in detailed view) */}
                      {exerciseDetail?.instructions && exerciseDetail.instructions.length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Step-by-Step Instructions
                          </h3>
                          <ol className="modal-instructions-list">
                            {exerciseDetail.instructions.map((instruction, idx) => (
                              <li key={idx} className="modal-instruction-item">
                                {instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Exercise Tips Section (only in detailed view) */}
                      {exerciseDetail?.exerciseTips && exerciseDetail.exerciseTips.length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Pro Tips & Safety
                          </h3>
                          <ul className="modal-tips-list">
                            {exerciseDetail.exerciseTips.map((tip, idx) => (
                              <li key={idx} className="modal-tip-item">
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Variations Section (only in detailed view) */}
                      {exerciseDetail?.variations && exerciseDetail.variations.length > 0 && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Exercise Variations
                          </h3>
                          <ul className="modal-variations-list">
                            {exerciseDetail.variations.map((variation, idx) => (
                              <li key={idx} className="modal-variation-item">
                                {variation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Video Link (only in detailed view) */}
                      {exerciseDetail?.videoUrl && exerciseDetail.videoUrl !== 'string' && (
                        <div className="modal-detail-group">
                          <h3 className="modal-detail-title">
                            Video Tutorial
                          </h3>
                          <a 
                            href={exerciseDetail.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="modal-video-link"
                          >
                            Watch Video Tutorial
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoadingExercises && hasSearched && exercises.length === 0 && !exerciseError && (
              <div className="no-results">
                <h3>No exercises found</h3>
                <p>Try a different search term. Examples: "bench press", "squat", "push up"</p>
              </div>
            )}

            {/* Initial State */}
            {!isLoadingExercises && !hasSearched && (
              <div className="no-results">
                <h3>Ready to explore exercises?</h3>
                <p>Enter an exercise name above to search our live exercise database. Try "bench press", "squat", or "deadlift".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}


