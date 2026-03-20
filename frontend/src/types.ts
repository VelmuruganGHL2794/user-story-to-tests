export interface GenerateRequest {
  storyTitle:          string;
  acceptanceCriteria:  string;
  description?:        string;
  prdContent?:         string;
  additionalInfo?:     string;
}

export interface StoryData {
  taskId:              string;
  title:               string;
  description:         string;
  acceptanceCriteria:  string;
  prdContent:          string;
  attachments:         { name: string; type: string; size: number }[];
}

export interface Step {
  stepNo:         string;
  action:         string;
  expectedResult: string;
}

export interface TestCase {
  id:             string;
  title:          string;
  category:       'Positive' | 'Negative' | 'Edge' | 'Authorization' | 'Non-Functional';
  steps:          Step[];
  testData:       string;
  expectedResult: string;
}

export interface GenerateResponse {
  testCases:         TestCase[];
  model:             string;
  totalTokens:       number;
  promptTokens:      number;
  completionTokens:  number;
}
