import axios from 'axios';
import { env } from '../env';

/**
 * Plain Axios instance with NO interceptors.
 * Used exclusively for the token refresh endpoint to avoid
 * infinite loops in the main client's response interceptor.
 */
const refreshClient = axios.create({
  baseURL: `${env.VITE_API_BASE_URL}/api/v1`,
  withCredentials: true, // send httpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

export default refreshClient;
