import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'/api'});
api.interceptors.request.use(config=>{const token=localStorage.getItem('aurastudy_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r.data.data,e=>{const message=e.response?.data?.message||(e.code==='ERR_NETWORK'?'AuraStudy API is unavailable. Start the API and make sure MongoDB is running.':'Something went wrong. Please try again.');return Promise.reject(new Error(message));});
export default api;
