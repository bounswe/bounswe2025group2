import { useState, useMemo, useEffect } from 'react';
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

interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'Exercise' | 'Nutrition' | 'Wellness' | 'Training' | 'Anatomy';
}

const glossaryTerms: GlossaryTerm[] = [
  // Exercise Terms
  {
    term: 'Aerobic Exercise',
    definition: 'Physical activity that increases heart rate and breathing, using oxygen to meet energy demands. Examples include running, swimming, and cycling. Also known as cardiovascular or cardio exercise.',
    category: 'Exercise'
  },
  {
    term: 'Anaerobic Exercise',
    definition: 'High-intensity physical activity performed in short bursts where the body\'s demand for oxygen exceeds available supply. Examples include sprinting, weightlifting, and HIIT.',
    category: 'Exercise'
  },
  {
    term: 'HIIT (High-Intensity Interval Training)',
    definition: 'A training technique that alternates between intense bursts of activity and fixed periods of less-intense activity or rest. Known for burning calories efficiently in a short time.',
    category: 'Exercise'
  },
  {
    term: 'Plyometrics',
    definition: 'Jump training or explosive exercises designed to increase power and speed. Involves rapid stretching and contracting of muscles. Examples include box jumps and burpees.',
    category: 'Exercise'
  },
  {
    term: 'Circuit Training',
    definition: 'A workout format where you perform a series of exercises back-to-back with minimal rest between exercises, moving from one exercise station to the next in a circuit.',
    category: 'Exercise'
  },
  {
    term: 'Progressive Overload',
    definition: 'The gradual increase of stress placed on the body during training. This can be achieved by increasing weight, reps, sets, or intensity to continually challenge muscles and promote growth.',
    category: 'Training'
  },
  {
    term: 'Compound Exercise',
    definition: 'A multi-joint movement that works multiple muscle groups simultaneously. Examples include squats, deadlifts, bench press, and pull-ups.',
    category: 'Exercise'
  },
  {
    term: 'Isolation Exercise',
    definition: 'A single-joint movement that targets a specific muscle group. Examples include bicep curls, leg extensions, and tricep pushdowns.',
    category: 'Exercise'
  },
  {
    term: 'Rep (Repetition)',
    definition: 'A single complete motion of an exercise. For example, one push-up from start to finish is one repetition.',
    category: 'Training'
  },
  {
    term: 'Set',
    definition: 'A group of consecutive repetitions performed without rest. For example, doing 10 push-ups in a row would be one set of 10 reps.',
    category: 'Training'
  },
  {
    term: 'Volume',
    definition: 'The total amount of work performed in a training session, typically calculated as sets × reps × weight. Higher volume generally leads to greater muscle endurance and size.',
    category: 'Training'
  },
  {
    term: 'Intensity',
    definition: 'The level of effort or weight used during exercise, often expressed as a percentage of one-rep max (1RM). Higher intensity typically builds more strength.',
    category: 'Training'
  },
  {
    term: 'One-Rep Max (1RM)',
    definition: 'The maximum amount of weight you can lift for a single repetition of a given exercise with proper form.',
    category: 'Training'
  },
  {
    term: 'Supersets',
    definition: 'Performing two exercises back-to-back with no rest in between. Can target the same muscle group (compound set) or opposing muscle groups (antagonistic superset).',
    category: 'Training'
  },
  {
    term: 'Drop Sets',
    definition: 'A technique where you perform an exercise to failure, then immediately reduce the weight and continue for more reps. Repeated several times to increase muscle fatigue.',
    category: 'Training'
  },
  
  // Nutrition Terms
  {
    term: 'Macronutrients',
    definition: 'The three main nutrients required in large amounts: protein, carbohydrates, and fats. They provide energy and are essential for growth, metabolism, and other body functions.',
    category: 'Nutrition'
  },
  {
    term: 'Micronutrients',
    definition: 'Vitamins and minerals required in smaller amounts but essential for proper body function, immune system support, and disease prevention.',
    category: 'Nutrition'
  },
  {
    term: 'Protein',
    definition: 'A macronutrient made of amino acids, essential for building and repairing muscle tissue, producing enzymes and hormones. Found in meat, fish, eggs, legumes, and dairy.',
    category: 'Nutrition'
  },
  {
    term: 'Carbohydrates',
    definition: 'The body\'s primary energy source, broken down into glucose. Includes simple carbs (sugars) and complex carbs (starches and fiber). Found in grains, fruits, vegetables.',
    category: 'Nutrition'
  },
  {
    term: 'Fats',
    definition: 'Essential macronutrient for hormone production, nutrient absorption, and energy storage. Includes saturated, unsaturated, and trans fats. Found in oils, nuts, fish, and dairy.',
    category: 'Nutrition'
  },
  {
    term: 'Caloric Deficit',
    definition: 'Consuming fewer calories than your body burns, resulting in weight loss. The body uses stored fat for energy when in a caloric deficit.',
    category: 'Nutrition'
  },
  {
    term: 'Caloric Surplus',
    definition: 'Consuming more calories than your body burns, resulting in weight gain. Essential for muscle building when combined with resistance training.',
    category: 'Nutrition'
  },
  {
    term: 'BMR (Basal Metabolic Rate)',
    definition: 'The number of calories your body needs to perform basic life-sustaining functions at rest. Accounts for about 60-75% of daily calorie expenditure.',
    category: 'Nutrition'
  },
  {
    term: 'TDEE (Total Daily Energy Expenditure)',
    definition: 'The total number of calories you burn in a day, including BMR, physical activity, digestion, and daily movement.',
    category: 'Nutrition'
  },
  {
    term: 'Glycogen',
    definition: 'The stored form of glucose (carbohydrates) in muscles and liver. Primary fuel source during high-intensity exercise.',
    category: 'Nutrition'
  },
  {
    term: 'Hydration',
    definition: 'Maintaining adequate fluid levels in the body. Proper hydration is essential for performance, recovery, temperature regulation, and overall health.',
    category: 'Nutrition'
  },
  {
    term: 'Electrolytes',
    definition: 'Minerals in blood and body fluids that carry an electric charge. Include sodium, potassium, calcium, and magnesium. Essential for hydration, muscle function, and nerve signaling.',
    category: 'Nutrition'
  },
  
  // Anatomy Terms
  {
    term: 'Core',
    definition: 'The group of muscles in the center of the body including abdominals, obliques, lower back, and pelvic floor. Provides stability and power for nearly all movements.',
    category: 'Anatomy'
  },
  {
    term: 'Quadriceps',
    definition: 'The four-muscle group on the front of the thigh (vastus lateralis, vastus medialis, vastus intermedius, rectus femoris). Primary function is knee extension.',
    category: 'Anatomy'
  },
  {
    term: 'Hamstrings',
    definition: 'The three muscles on the back of the thigh (biceps femoris, semitendinosus, semimembranosus). Primary function is knee flexion and hip extension.',
    category: 'Anatomy'
  },
  {
    term: 'Glutes',
    definition: 'The gluteal muscles (gluteus maximus, medius, minimus) form the buttocks. The largest muscle group in the body, essential for hip movement, posture, and power.',
    category: 'Anatomy'
  },
  {
    term: 'Deltoids',
    definition: 'The shoulder muscles with three heads (anterior, lateral, posterior). Responsible for shoulder abduction, flexion, and extension.',
    category: 'Anatomy'
  },
  {
    term: 'Pectorals',
    definition: 'The chest muscles (pectoralis major and minor). Involved in pushing movements and bringing arms across the body.',
    category: 'Anatomy'
  },
  {
    term: 'Latissimus Dorsi',
    definition: 'Large, flat muscles on the back that extend from the lower spine to the upper arm. Responsible for pulling movements and shoulder extension.',
    category: 'Anatomy'
  },
  {
    term: 'Biceps',
    definition: 'The two-headed muscle on the front of the upper arm. Primary function is elbow flexion and forearm supination.',
    category: 'Anatomy'
  },
  {
    term: 'Triceps',
    definition: 'The three-headed muscle on the back of the upper arm. Primary function is elbow extension. Makes up about 2/3 of upper arm mass.',
    category: 'Anatomy'
  },
  
  // Wellness Terms
  {
    term: 'Recovery',
    definition: 'The period after exercise when the body repairs tissues and adapts to training stress. Includes rest, nutrition, sleep, and active recovery methods.',
    category: 'Wellness'
  },
  {
    term: 'Active Recovery',
    definition: 'Low-intensity exercise performed on rest days to promote blood flow and healing without adding significant stress. Examples include walking, light swimming, or yoga.',
    category: 'Wellness'
  },
  {
    term: 'Stretching',
    definition: 'Exercises that improve flexibility by lengthening muscles and connective tissues. Includes static (holding positions) and dynamic (movement-based) stretching.',
    category: 'Wellness'
  },
  {
    term: 'Flexibility',
    definition: 'The range of motion available at a joint or group of joints. Can be improved through stretching, yoga, and regular movement.',
    category: 'Wellness'
  },
  {
    term: 'Mobility',
    definition: 'The ability to move freely and easily through a full range of motion with control. Combines flexibility with strength and coordination.',
    category: 'Wellness'
  },
  {
    term: 'Foam Rolling',
    definition: 'A self-myofascial release technique using a foam cylinder to massage muscles, reduce tension, and improve blood flow. Helps with recovery and flexibility.',
    category: 'Wellness'
  },
  {
    term: 'DOMS (Delayed Onset Muscle Soreness)',
    definition: 'Muscle pain and stiffness that develops 24-72 hours after intense or unfamiliar exercise. Caused by microscopic muscle damage and inflammation.',
    category: 'Wellness'
  },
  {
    term: 'Overtraining',
    definition: 'A condition resulting from excessive exercise without adequate rest, leading to decreased performance, fatigue, mood changes, and increased injury risk.',
    category: 'Wellness'
  },
  {
    term: 'Plateau',
    definition: 'A period where progress stalls despite continued training. Can occur with strength gains, weight loss, or endurance improvements. Often resolved by changing training variables.',
    category: 'Wellness'
  },
  {
    term: 'Warm-Up',
    definition: 'Light activity performed before exercise to gradually increase heart rate, body temperature, and blood flow to muscles. Reduces injury risk and improves performance.',
    category: 'Wellness'
  },
  {
    term: 'Cool-Down',
    definition: 'Light activity performed after exercise to gradually reduce heart rate and prevent blood pooling. Typically includes light cardio and stretching.',
    category: 'Wellness'
  },
  {
    term: 'Heart Rate Zones',
    definition: 'Five ranges of heart rate intensity used to guide training: Zone 1 (50-60%), Zone 2 (60-70%), Zone 3 (70-80%), Zone 4 (80-90%), Zone 5 (90-100% of max heart rate).',
    category: 'Wellness'
  },
  {
    term: 'VO2 Max',
    definition: 'The maximum rate at which the body can consume oxygen during intense exercise. A measure of cardiovascular fitness and aerobic endurance.',
    category: 'Wellness'
  },
  {
    term: 'Resting Heart Rate',
    definition: 'The number of heartbeats per minute when at complete rest. A lower resting heart rate generally indicates better cardiovascular fitness.',
    category: 'Wellness'
  },
  {
    term: 'Form',
    definition: 'The proper technique and body positioning during exercise. Good form maximizes results, prevents injury, and ensures target muscles are properly engaged.',
    category: 'Training'
  },
  {
    term: 'Tempo',
    definition: 'The speed at which you perform each phase of an exercise repetition. Often written as four numbers (e.g., 3-1-2-0) representing eccentric, pause, concentric, and pause phases.',
    category: 'Training'
  },
  {
    term: 'Eccentric Phase',
    definition: 'The lengthening phase of a muscle contraction, typically when lowering a weight. Often where most muscle damage (and growth stimulus) occurs.',
    category: 'Training'
  },
  {
    term: 'Concentric Phase',
    definition: 'The shortening phase of a muscle contraction, typically when lifting a weight. The "working" portion of most exercises.',
    category: 'Training'
  },
  {
    term: 'Periodization',
    definition: 'Systematic planning of training that varies intensity and volume over specific periods to optimize performance, prevent overtraining, and peak for competitions.',
    category: 'Training'
  },
  {
    term: 'Functional Fitness',
    definition: 'Training that improves the ability to perform everyday activities by mimicking common movements. Emphasizes compound exercises and full-body movements.',
    category: 'Training'
  },
  {
    term: 'Cross-Training',
    definition: 'Incorporating different types of exercise into your routine to improve overall fitness, prevent overuse injuries, and avoid training monotony.',
    category: 'Training'
  },
];

type TabType = 'glossary' | 'exercises';

export default function GlossaryPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('glossary');
  
  // Glossary state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

  const categories = ['All', 'Exercise', 'Nutrition', 'Wellness', 'Training', 'Anatomy'];

  // Filter glossary terms
  const filteredTerms = useMemo(() => {
    return glossaryTerms
      .filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            term.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
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
      if (e.key === 'Escape' && selectedExercise) {
        closeModal();
      }
    };

    if (selectedExercise) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedExercise]);

  return (
    <Layout onSearch={handleSearch}>
      <div className="glossary-content">
        <section className="glossary-hero">
          <h1>Fitness Knowledge Hub</h1>
          <p>Explore fitness terminology and discover exercises from our live database</p>
        </section>

        {/* Tabs Navigation */}
        <div className="glossary-tabs">
          <button
            className={`glossary-tab ${activeTab === 'glossary' ? 'active' : ''}`}
            onClick={() => setActiveTab('glossary')}
          >
            Glossary Terms
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
                  placeholder="Search terms or definitions..."
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
                        ? glossaryTerms.length
                        : glossaryTerms.filter(t => t.category === category).length}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="glossary-results">
              {filteredTerms.length > 0 ? (
                <>
                  <div className="results-count">
                    Showing {filteredTerms.length} {filteredTerms.length === 1 ? 'term' : 'terms'}
                  </div>
                  <div className="terms-grid">
                    {filteredTerms.map((item, index) => (
                      <div key={index} className="term-card">
                        <div className="term-header">
                          <h3 className="term-title">{item.term}</h3>
                          <span className={`category-badge ${item.category.toLowerCase()}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="term-definition">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-results">
                  <h3>No terms found</h3>
                  <p>Try adjusting your search or filter to find what you're looking for.</p>
                </div>
              )}
            </section>
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

