import { TaskPriority } from "../enum";

export const getPriorityValue = ({importance=3, urgency=3}) => {
  if(importance === 4 && urgency === 4){
    return TaskPriority.High
  }
  if(importance === 3 && urgency === 3){
    return TaskPriority.Low
  }
  return TaskPriority.Medium
}