import React from 'react'
import { Navigate } from "react-router-dom";

type Props = {
    children: React.ReactNode;
    isAuthenticated: boolean;
}

const PrivateRoute = ({ children, isAuthenticated }: Props) => {
    return isAuthenticated ? children : <Navigate to="/auth/signin" />;
};

export default PrivateRoute