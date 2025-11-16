import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useIsAuthenticated, useGoals, useChallenges, useUserStats, useDailyQuote, useUserChallenges } from '../../lib';
import { GFapi } from '../../lib/api/GFapi';
import type { FoodItem } from '../../lib/types/api';

import { Layout, ActivityDashboard, DailyAdvice } from '../../components';
import { Button } from '../../components/ui/button';
import './home_page.css';

function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const navigate = useNavigate();

  // Data hooks
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals();
  const { data: challenges = [], isLoading: challengesLoading, error: challengesError } = useChallenges();
  const { data: dailyQuote, error: quoteError } = useDailyQuote();
  const stats = useUserStats();
  const userChallenges = useUserChallenges();

  // Nutrition analyzer state
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);



  // Redirect to auth if not authenticated
  if (authLoading) {
    return <div className="home-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search functionality here
  };

  const handleAnalyzeFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setNutritionError(null);

    try {
      const response = await GFapi.post<{ foods: FoodItem[] }>('/api/parse_food/', { query });
      setFoods(response.foods || []);
    } catch (error) {
      console.error('Error analyzing food:', error);
      setNutritionError('Failed to analyze food. Please try again.');
      setFoods([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show loading state
  const isLoading = goalsLoading || challengesLoading;
  if (isLoading) {
    return (
      <Layout onSearch={handleSearch}>
        <div className="home-content">
          <div className="home-loading">Loading your dashboard...</div>
        </div>
      </Layout>
    );
  }

  // Show error state
  const hasError = goalsError || challengesError;
  if (hasError) {
    return (
      <Layout onSearch={handleSearch}>
        <div className="home-content">
          <div className="home-error">
            <h2>Unable to load dashboard</h2>
            <p>Please try refreshing the page or check your connection.</p>
            <Button onClick={() => window.location.reload()} className="action-btn">
              Refresh Page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSearch={handleSearch}>
      <div className="home-content">
        {/* Daily Quote Section */}
        {dailyQuote && !quoteError && (
          <section className="quote-section">
            <blockquote className="quote-text">
              "{dailyQuote.text}"
            </blockquote>
            <cite className="quote-author">— {dailyQuote.author}</cite>
          </section>
        )}

        {/* Activity Dashboard with Stats */}
        <section className="activity-dashboard-section">
          <ActivityDashboard 
            goals={goals} 
            challenges={challenges}
            activeGoals={stats.activeGoals}
            joinedChallenges={userChallenges.data?.length || 0}
          />
        </section>

        {/* Daily AI Advice Section */}
        <DailyAdvice />

        {/* Nutrition Analyzer */}
        <section className="nutrition-section">
          <div className="section-header nutrition-header">
            <h2>Nutrition Analyzer</h2>
          </div>
          <form onSubmit={handleAnalyzeFood} className="nutrition-form">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 2 eggs and a banana"
              className="nutrition-input"
              disabled={isAnalyzing}
            />
            <Button 
              type="submit" 
              className="action-btn"
              disabled={isAnalyzing || !query.trim()}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>

          {nutritionError && (
            <div className="nutrition-error">
              <p>{nutritionError}</p>
            </div>
          )}

          {foods.length > 0 && (
            <div className="nutrition-results">
              {foods.map((food, index) => (
                <div key={index} className="food-card">
                  <h3>{food.food_name}</h3>
                  <div className="food-details">
                    <div className="food-detail">
                      <span className="detail-label">Serving:</span>
                      <span className="detail-value">
                        {food.serving_qty} {food.serving_unit} ({food.serving_weight_grams}g)
                      </span>
                    </div>
                    <div className="food-detail">
                      <span className="detail-label">Calories:</span>
                      <span className="detail-value">{food.nf_calories.toFixed(1)} cal</span>
                    </div>
                    <div className="food-detail">
                      <span className="detail-label">Protein:</span>
                      <span className="detail-value">{food.nf_protein.toFixed(1)}g</span>
                    </div>
                    <div className="food-detail">
                      <span className="detail-label">Carbs:</span>
                      <span className="detail-value">{food.nf_total_carbohydrate.toFixed(1)}g</span>
                    </div>
                    <div className="food-detail">
                      <span className="detail-label">Fat:</span>
                      <span className="detail-value">{food.nf_total_fat.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isAnalyzing && foods.length === 0 && !nutritionError && (
            <div className="empty-state">
              <p>Enter food items to analyze their nutritional content</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default HomePage;