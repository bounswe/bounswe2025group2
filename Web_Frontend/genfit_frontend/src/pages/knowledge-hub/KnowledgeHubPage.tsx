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
import { glossaryExercises, type GlossaryExercise } from './glossaryData';


// ... existing imports ...
import { GlossaryTermsContent } from '../glossary/GlossaryPage';

// ... existing code ...

type TabType = 'glossary' | 'exercises' | 'terms';

export default function GlossaryPage() { // Note: Function name should probably be updated too, but default export handles filename change. Keeping internal name for diff simplicity or renaming if I can. Let's rename it to KnowledgeHubPage for consistency.
  // URL search params for exercise linking
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedExerciseRef = useRef<HTMLDivElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('glossary');

  // Glossary state (Existing Exercise Library)
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

  // Terms Tab State
  const [termsSearchTerm, setTermsSearchTerm] = useState('');

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // ... existing filter logic ...
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

  // ... (handleExerciseSearch, handleSearch, formatResetTime, handleExerciseClick, closeModal, handleViewFullDetails, keydown effect) ...
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
    } catch (error: unknown) {
      let errorMessage = 'Failed to search exercises. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setExerciseError(errorMessage);
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
    } catch (error: unknown) {
      let errorMessage = 'Failed to load full details. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setDetailError(errorMessage);
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

  // Handle URL params
  useEffect(() => {
    const exerciseName = searchParams.get('exercise');
    const term = searchParams.get('term');
    const exerciseIdParam = searchParams.get('exerciseId');

    let foundExercise: GlossaryExercise | undefined;

    if (exerciseIdParam) {
      // Switch to glossary tab
      setActiveTab('glossary');

      // Find the exercise by ID
      const exerciseId = parseInt(exerciseIdParam, 10);
      foundExercise = glossaryExercises.find(ex => ex.id === exerciseId);
    } else if (exerciseName) {
      // Switch to exercise library tab
      setActiveTab('glossary');
      setSearchTerm(exerciseName);

      // Find the exercise by name (case-insensitive)
      foundExercise = glossaryExercises.find(
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
    }

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
    else if (term) {
      setActiveTab('terms');
      setTermsSearchTerm(term);
    }
  }, [searchParams, setSearchParams]);

  return (
    <Layout onSearch={handleSearch}>
      <div className="glossary-content">
        <section className="glossary-hero">
          <h1>Fitness Knowledge Hub</h1>
          <p>Explore exercises, search our database, and master fitness terminology</p>
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
          <button
            className={`glossary-tab ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            Glossary
          </button>
        </div>

        {/* Glossary Tab (Exercise Library) Content */}
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

        {/* Terms Tab Content (Newly Incorporated) */}
        {activeTab === 'terms' && (
          <GlossaryTermsContent initialSearchTerm={termsSearchTerm} />
        )}
      </div>
    </Layout>
  );
}


