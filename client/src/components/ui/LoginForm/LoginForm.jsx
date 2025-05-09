import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginInput, LoginButton } from './style.jsx';
import { useForm } from 'react-hook-form';
import './style.css';

import AuthService from '../../../services/auth.service.js';

export default function LoginForm () {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm()

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("")

    const navigate = useNavigate();

    const handleLogin = ( formData ) => {
        setErrorMessage("")
        setLoading(true)

        AuthService.login( formData.username, formData.password ).then(
            () => {
                navigate("/");
                window.location.reload();
            },
            (error) => {
                setLoading(false)
                const resMessage = (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                    error.message ||
                    error.toString();
                setErrorMessage(resMessage);
            }
        );
    }

    return (
        <div className="login-form">
            <div className="login-form__content">
                <div className="login-form__heading">Sign in</div>
                <div className="login-form__create-account">
                    <Link to="/signup">Create an account</Link>
                </div>
                {errorMessage && <div className="login-form__error">{errorMessage}</div>}
                <form onSubmit={handleSubmit(handleLogin)}>
                    <div className="login-form__inputs">
                        <input {...register("username", { 
                            required: "Username is required", 
                            maxLength: { value: 20, message: "Username cannot be more than 20 characters" },
                            minLength: { value: 3, message: "Username cannot be less than 3 characters"}
                        })} 
                            type="text" 
                            placeholder="Username"
                        />
                        { errors.username && <span>{errors.username.message}</span>}

                        <input {...register("password", { 
                            required: "Password is required", 
                            maxLength: { value: 30, message: "Password cannot be more than 30 characters" },
                            minLength: { value: 3, message: "Password cannot be less than 3 characters"}
                        })} 
                            type="password"
                            placeholder="Password"
                        />
                        { errors.password && <span>{errors.password.message}</span>}

                        <input 
                            type="submit" 
                            value={loading ? "Signing in..." : "Sign in"}
                            disabled={loading}
                        />
                    </div>
                </form>
           </div>
        </div>
    )
}

