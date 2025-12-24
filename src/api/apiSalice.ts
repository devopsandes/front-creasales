import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DataLogin, ErrorResponse, LoginResponse } from "../interfaces/auth.interface";

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:3000/api/v1"}),
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse & ErrorResponse,DataLogin>({
            query: (user) => ({
                url: '/auth/signin',
                method: "POST",
                body: user
            })
        })
    })
})

export const {
    useLoginMutation
} = apiSlice