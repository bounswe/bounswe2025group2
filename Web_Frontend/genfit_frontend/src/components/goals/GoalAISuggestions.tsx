/**
 * Goal AI Suggestions Component
 * Displays AI-powered suggestions for goals with option to apply them
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { GoalSuggestion } from '@/lib/api/goalSuggestionsApi';

interface GoalAISuggestionsProps {
  suggestion: GoalSuggestion;
  onApply: (suggestion: GoalSuggestion) => void;
  onChatClick?: () => void;
}

export const GoalAISuggestions: React.FC<GoalAISuggestionsProps> = ({
  suggestion,
  onApply,
  onChatClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Reset expansion state when new suggestions arrive
  useEffect(() => {
    setIsExpanded(true);
  }, [suggestion]);
  if (!suggestion.is_realistic) {
    return (
      <Card className="bg-orange-50 border border-[#e5e7eb] shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <h4 className="font-semibold text-orange-900">
                Unrealistic Goal Detected
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-600 hover:text-orange-800 transition-colors p-1 focus:outline-none focus:ring-0"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {isExpanded && (
            <>
              <p className="text-sm text-orange-800 mb-3 leading-relaxed">
                {suggestion.warning_message}
              </p>
              <div className="bg-white rounded-md p-3 mb-3 border border-orange-100">
                <p className="text-xs font-medium text-gray-600 mb-2">Recommended Alternative:</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Target:</strong> {suggestion.target_value} {suggestion.unit}</div>
                  <div><strong>Timeline:</strong> {suggestion.days_to_complete} days</div>
                  <div><strong>Type:</strong> {formatGoalType(suggestion.goal_type)}</div>
                </div>
              </div>
            </>
          )}
          
          <Button
            type="button"
            onClick={() => onApply(suggestion)}
            size="sm"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Suggestions to Form
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-emerald-50 border border-[#e5e7eb] shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <h4 className="font-semibold text-emerald-900">
              AI Suggestions
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-emerald-600 hover:text-emerald-800 transition-colors p-1 focus:outline-none focus:ring-0"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {isExpanded && (
          <>
            <div className="bg-white rounded-md p-3 mb-3 border border-emerald-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Recommended Settings:</p>
              <div className="text-sm text-gray-700 space-y-1">
                <div><strong>Target:</strong> {suggestion.target_value} {suggestion.unit}</div>
                <div><strong>Timeline:</strong> {suggestion.days_to_complete} days</div>
                <div><strong>Type:</strong> {formatGoalType(suggestion.goal_type)}</div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Tips:</p>
              <div className="space-y-2">
                {suggestion.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 pl-3 py-1.5 border-l-2 border-emerald-400 bg-white rounded-r"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => onApply(suggestion)}
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Suggestions to Form
          </Button>
          {onChatClick && (
            <button
              type="button"
              onClick={onChatClick}
              className="text-xs text-center font-medium px-4 py-2 rounded-md transition-all"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                color: 'white'
              }}
            >
              Need more tips? Chat with AI →
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

const formatGoalType = (goalType: string): string => {
  const formatted = goalType.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};
