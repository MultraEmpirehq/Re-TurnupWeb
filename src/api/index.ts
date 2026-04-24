import useUserStore from "@/stores/user-store";
import axios, { AxiosRequestConfig } from "axios";
import { toast } from "sonner";

const baseURL = `${process.env.NEXT_PUBLIC_BASE_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

// Lazy initialization to avoid circular dependency
const getResetUserDetails = () => useUserStore.getState().clearStore;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      error?.config?.url !== "/auth/login/admin"
    ) {
      getResetUserDetails()();
      toast.error("Login expired! Please login again.");
    }
    return Promise.reject(error);
  },
);

api.interceptors.request.use(
  (config) => {
    // Not used.. Rely on cookie for authentication
    // const authToken = useUserStore.getState().userToken;
    // if (authToken) {
    //   config.headers.Authorization = `Bearer ${authToken || ""}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
export const setHeaderAuthorization: (token?: string) => void = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    api.defaults.headers.common.Authorization = undefined;
  }
};

export const postData = <T, D>(
  url: string,
  data?: T | undefined,
  options?: AxiosRequestConfig,
): TApiRequestResponseType<D> => {
  return api.post(url, data, options);
};

export const getData = <T>(
  url: string,
  options?: AxiosRequestConfig,
): TApiRequestResponseType<T> => {
  return api.get(url, options);
};

export const putData = <T, D>(
  url: string,
  data: T | undefined,
  options?: AxiosRequestConfig,
): TApiRequestResponseType<D> => {
  return api.put(url, data, options);
};

export const patchData = <T, D>(
  url: string,
  data: T | undefined,
  options?: AxiosRequestConfig,
): TApiRequestResponseType<D> => {
  return api.patch(url, data, options);
};

export const deleteData = <T>(
  url: string,
  options?: AxiosRequestConfig,
): TApiRequestResponseType<T | undefined> => {
  return api.delete(url, options);
};

export default api;
