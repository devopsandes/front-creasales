import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSalice";
import authReducer from "./slices/authSlice"

const store = configureStore({
    reducer:{
        auth: authReducer,
        [apiSlice.reducerPath]: apiSlice.reducer 
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware)
})

export type RootState = ReturnType<typeof store.getState>

export default store