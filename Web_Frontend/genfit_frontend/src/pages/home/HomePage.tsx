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
      const response = await GFapi.post<{ totalHits: number; query: string; foods: FoodItem[] }>('/api/parse_food/', { query });
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
                <div key={food.fdcId || index} className="food-card">
                  <div className="food-header">
                    <h3>{food.description}</h3>
                    {food.brandName && (
                      <span className="brand-name">{food.brandName}</span>
                    )}
                    {!food.brandName && food.brandOwner && (
                      <span className="brand-owner">{food.brandOwner}</span>
                    )}
                  </div>
                  
                  {food.servingSize && (
                    <div className="serving-info">
                      Serving: {food.servingSize} {food.servingSizeUnit}
                    </div>
                  )}

                  <div className="food-details">
                    {/* Main Macros */}
                    {food.nutrients['Energy'] && (
                      <div className="food-detail macro">
                        <span className="detail-label">Calories:</span>
                        <span className="detail-value">
                          {food.nutrients['Energy'].value.toFixed(1)} {food.nutrients['Energy'].unit.toLowerCase()}
                        </span>
                      </div>
                    )}
                    {food.nutrients['Protein'] && (
                      <div className="food-detail macro">
                        <span className="detail-label">Protein:</span>
                        <span className="detail-value">
                          {food.nutrients['Protein'].value.toFixed(1)}{food.nutrients['Protein'].unit.toLowerCase()}
                        </span>
                      </div>
                    )}
                    {food.nutrients['Carbohydrate, by difference'] && (
                      <div className="food-detail macro">
                        <span className="detail-label">Carbs:</span>
                        <span className="detail-value">
                          {food.nutrients['Carbohydrate, by difference'].value.toFixed(1)}{food.nutrients['Carbohydrate, by difference'].unit.toLowerCase()}
                        </span>
                      </div>
                    )}
                    {food.nutrients['Total lipid (fat)'] && (
                      <div className="food-detail macro">
                        <span className="detail-label">Fat:</span>
                        <span className="detail-value">
                          {food.nutrients['Total lipid (fat)'].value.toFixed(1)}{food.nutrients['Total lipid (fat)'].unit.toLowerCase()}
                        </span>
                      </div>
                    )}

                    {/* Additional Nutrients */}
                    <div className="nutrients-grid">
                      {food.nutrients['Fiber, total dietary'] && (
                        <div className="food-detail">
                          <span className="detail-label">Fiber:</span>
                          <span className="detail-value">
                            {food.nutrients['Fiber, total dietary'].value.toFixed(1)}{food.nutrients['Fiber, total dietary'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Total Sugars'] && (
                        <div className="food-detail">
                          <span className="detail-label">Sugars:</span>
                          <span className="detail-value">
                            {food.nutrients['Total Sugars'].value.toFixed(1)}{food.nutrients['Total Sugars'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Cholesterol'] && (
                        <div className="food-detail">
                          <span className="detail-label">Cholesterol:</span>
                          <span className="detail-value">
                            {food.nutrients['Cholesterol'].value.toFixed(1)}{food.nutrients['Cholesterol'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Sodium, Na'] && (
                        <div className="food-detail">
                          <span className="detail-label">Sodium:</span>
                          <span className="detail-value">
                            {food.nutrients['Sodium, Na'].value.toFixed(1)}{food.nutrients['Sodium, Na'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Potassium, K'] && (
                        <div className="food-detail">
                          <span className="detail-label">Potassium:</span>
                          <span className="detail-value">
                            {food.nutrients['Potassium, K'].value.toFixed(0)}{food.nutrients['Potassium, K'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Calcium, Ca'] && (
                        <div className="food-detail">
                          <span className="detail-label">Calcium:</span>
                          <span className="detail-value">
                            {food.nutrients['Calcium, Ca'].value.toFixed(1)}{food.nutrients['Calcium, Ca'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Iron, Fe'] && (
                        <div className="food-detail">
                          <span className="detail-label">Iron:</span>
                          <span className="detail-value">
                            {food.nutrients['Iron, Fe'].value.toFixed(2)}{food.nutrients['Iron, Fe'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Vitamin C, total ascorbic acid'] && (
                        <div className="food-detail">
                          <span className="detail-label">Vitamin C:</span>
                          <span className="detail-value">
                            {food.nutrients['Vitamin C, total ascorbic acid'].value.toFixed(1)}{food.nutrients['Vitamin C, total ascorbic acid'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Vitamin D (D2 + D3)'] && food.nutrients['Vitamin D (D2 + D3)'].value > 0 && (
                        <div className="food-detail">
                          <span className="detail-label">Vitamin D:</span>
                          <span className="detail-value">
                            {food.nutrients['Vitamin D (D2 + D3)'].value.toFixed(1)}{food.nutrients['Vitamin D (D2 + D3)'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Vitamin E (alpha-tocopherol)'] && food.nutrients['Vitamin E (alpha-tocopherol)'].value > 0 && (
                        <div className="food-detail">
                          <span className="detail-label">Vitamin E:</span>
                          <span className="detail-value">
                            {food.nutrients['Vitamin E (alpha-tocopherol)'].value.toFixed(2)}{food.nutrients['Vitamin E (alpha-tocopherol)'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Vitamin B-12'] && food.nutrients['Vitamin B-12'].value > 0 && (
                        <div className="food-detail">
                          <span className="detail-label">Vitamin B-12:</span>
                          <span className="detail-value">
                            {food.nutrients['Vitamin B-12'].value.toFixed(2)}{food.nutrients['Vitamin B-12'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {food.nutrients['Caffeine'] && food.nutrients['Caffeine'].value > 0 && (
                        <div className="food-detail">
                          <span className="detail-label">Caffeine:</span>
                          <span className="detail-value">
                            {food.nutrients['Caffeine'].value.toFixed(1)}{food.nutrients['Caffeine'].unit.toLowerCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {food.ingredients && (
                    <div className="ingredients">
                      <span className="ingredients-label">Ingredients:</span> {food.ingredients}
                    </div>
                  )}
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