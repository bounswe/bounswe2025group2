import { Progress } from "@/components/ui/progress";

type GoalProgressProps = {
  goal: {
    id: number;
    title?: string;
    type: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    status: string;
  };
  showTitle?: boolean;
};

export default function GoalProgress({ goal, showTitle = false }: GoalProgressProps) {
  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((goal.currentValue / goal.targetValue) * 100),
    100
  );
  
  // Format the progress text
  const formatProgressText = () => {
    return `${goal.currentValue}/${goal.targetValue} ${goal.unit}`;
  };
  
  // Determine status color
  const getStatusColor = () => {
    if (goal.status === "completed") return "bg-active";
    if (progressPercentage >= 75) return "bg-active";
    if (progressPercentage >= 50) return "bg-subText";
    if (progressPercentage >= 25) return "bg-subText2";
    return "bg-passive";
  };

  return (
    <div className="space-y-1">
      {showTitle && goal.title && (
        <div className="font-medium text-sm">{goal.title}</div>
      )}
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium capitalize">{goal.title || goal.type}</span>
        <span>{formatProgressText()}</span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-2.5 bg-muted"
      />
    </div>
  );
}
