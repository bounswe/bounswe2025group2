/**
 * Goal AI Suggestions Component
 * Displays AI-powered suggestions for goals with option to apply them
 */

import React, { useState } from 'react';
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
  if (!suggestion.is_realistic) {
    return (
      <Card className="p-5 bg-orange-50 border-2 border-orange-300 shadow-sm">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-orange-900 text-base">
                ⚠️ Unrealistic Goal Detected
              </h4>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-orange-600 hover:text-orange-800 transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            
            {isExpanded && (
              <>
                <p className="text-sm text-orange-800 mb-4 leading-relaxed">
                  {suggestion.warning_message}
                </p>
                <div className="bg-white rounded-lg p-4 mb-4 border-2 border-orange-200 shadow-sm">
                  <h5 className="text-sm font-semibold text-gray-800 mb-3">
                    💡 Recommended Alternative:
                  </h5>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                      <strong className="mr-2">Target:</strong> {suggestion.target_value} {suggestion.unit}
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                      <strong className="mr-2">Timeline:</strong> {suggestion.days_to_complete} days
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                      <strong className="mr-2">Goal Type:</strong> {formatGoalType(suggestion.goal_type)}
                    </li>
                  </ul>
                </div>
              </>
            )}
            
            <Button
              type="button"
              onClick={() => onApply(suggestion)}
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Recommended Values to Form
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-emerald-50 border-2 border-emerald-300 shadow-sm">
      <div className="flex items-start gap-4">
        <Lightbulb className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-emerald-900 text-base">
              ✨ AI Suggestions
            </h4>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {isExpanded && (
            <>
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-emerald-200 shadow-sm">
                <h5 className="text-sm font-semibold text-gray-800 mb-3">
                  📊 Recommended Settings:
                </h5>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    <strong className="mr-2">Target:</strong> {suggestion.target_value} {suggestion.unit}
                  </li>
                  <li className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    <strong className="mr-2">Timeline:</strong> {suggestion.days_to_complete} days
                  </li>
                  <li className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    <strong className="mr-2">Goal Type:</strong> {formatGoalType(suggestion.goal_type)}
                  </li>
                </ul>
              </div>

              <div className="space-y-3 mb-4">
                <h5 className="text-sm font-semibold text-gray-800">
                  💪 Tips to Help You Succeed:
                </h5>
                {suggestion.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 pl-4 py-2 border-l-3 border-emerald-400 bg-emerald-50/50 rounded-r leading-relaxed"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => onApply(suggestion)}
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply These Values to Form
            </Button>
            {onChatClick && (
              <button
                type="button"
                onClick={onChatClick}
                className="text-xs text-gray-600 hover:text-emerald-700 underline-offset-2 hover:underline transition-colors py-1"
              >
                Want more personalized tips? Chat with AI →
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const formatGoalType = (goalType: string): string => {
  const formatted = goalType.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};
