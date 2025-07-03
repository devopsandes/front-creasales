import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSalice";
import authReducer from "./slices/authSlice"
import socketReducer from "./slices/socketSlice"
import actionReducer from "./slices/actionSlice"

const store = configureStore({
    reducer:{
        auth: authReducer,
        socket: socketReducer,
        action: actionReducer,
        [apiSlice.reducerPath]: apiSlice.reducer 
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware)
})

export type RootState = ReturnType<typeof store.getState>

export default store