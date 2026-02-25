import axios from 'axios';

const POST_API_BASE_URL = import.meta.env.VITE_POST_URL;

export interface Post {
  PostID: string;
  UserID: string;
  PostUrl: string | null;
  Description: string;
  Tags: string[];
  PostedTime: string;
  ApprovementReq: boolean;
  Approved: boolean;
}

export interface PostEngagement {
  PostID: string;
  LikedBy: string[];
  DislikedBy: string[];
}

export interface PostData {
  post: Post;
  engagement: PostEngagement;
  comments: any[];
}

const postApi = axios.create({
  baseURL: POST_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPostsRequiringApproval = async (doctorId: string): Promise<PostData[]> => {
  const response = await postApi.get(`/getpostsrequiringapproval/${doctorId}`);
  return response.data;
};

export const approvePost = async (doctorId: string, postId: string, approved: boolean): Promise<void> => {
  await postApi.put('/approvepost', {
    DoctorID: doctorId,
    PostID: postId,
    Approved: approved,
  });
};

export const getFileUrl = (postUrl: string | null): string | undefined => {
  if (!postUrl) return undefined;
  const FILE_BASE_URL = `${POST_API_BASE_URL.replace('/posts', '')}/file/uploads/`;
  return `${FILE_BASE_URL}${postUrl}`;
};