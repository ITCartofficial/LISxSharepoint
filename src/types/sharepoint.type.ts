export interface PromptItem {
  tag: string;
  prompt: string;
  isPosted?: boolean;
  isApproved?: boolean;
  scheduledAt: string;
  promptCreatedAt: string;
}

export interface PostItem {
  tag: string;
  platform: string;
  postedAt?: string;
  content?: string;
  visual?: string;
  postUrl: string;
  isApproved?: boolean;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
}

export interface LISItem {
  tag: string;
  prompt: PromptItem;
  post: PostItem;
}

export type SharePointListItem = PromptItem | PostItem;
