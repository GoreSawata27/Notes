"use client";
import { useState, useCallback } from "react";
import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DecodedToken {
  exp?: number;
  [key: string]: unknown;
}

export function useApi<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const callApi = useCallback(
    async (
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      endpoint: string,
      body?: unknown,
      config?: AxiosRequestConfig,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("jwtToken");

        if (!token) {
          router.push("/login");
          return Promise.reject("No token found. Redirecting to login.");
        }

        const decodedToken: DecodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          sessionStorage.removeItem("jwtToken");
          router.push("/login");
          return Promise.reject("Session expired. Please login again.");
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        // Only set JSON content-type if body is not FormData -> for image upload use formdata
        if (body && !(body instanceof FormData)) {
          headers["Content-Type"] = "application/json";
        }

        const res = await axios({
          method,
          url: `https://${API_URL}/${endpoint}`,
          data: body,
          headers,
          responseType: config?.responseType || "json",
          ...config,
        });

        setData(res.data);
        return res.data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "API request failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return { data, isLoading, error, callApi, setData };
}
