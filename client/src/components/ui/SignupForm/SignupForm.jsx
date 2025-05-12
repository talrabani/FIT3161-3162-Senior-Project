import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import './style.css';

import AuthService from '../../../services/auth.service.js';

export default function SignupForm() {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handleSignup = (formData) => {
        setErrorMessage("");
        setLoading(true);

        AuthService.signup(formData.username, formData.password, formData.email).then(
            () => {
                navigate("/login");
            },
            (error) => {
                setLoading(false);
                const resMessage = (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                    error.message ||
                    error.toString();
                setErrorMessage(resMessage);
            }
        );
    };

    return (
        <div className="signup-form">
            <div className="signup-form__content">
                <div className="signup-form__heading">Sign up</div>
                <div className="signup-form__login-link">
                    <Link to="/login">Already have an account? Sign in</Link>
                </div>
                {errorMessage && <div className="signup-form__error">{errorMessage}</div>}
                <form onSubmit={handleSubmit(handleSignup)}>
                    <div className="signup-form__inputs">
                        <input 
                            {...register("username", { 
                                required: "Username is required", 
                                maxLength: { value: 20, message: "Username cannot be more than 20 characters" },
                                minLength: { value: 3, message: "Username cannot be less than 3 characters"}
                            })} 
                            type="text" 
                            placeholder="Username"
                        />
                        {errors.username && <span>{errors.username.message}</span>}

                        <input 
                            {...register("email", { 
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })} 
                            type="email" 
                            placeholder="Email Address"
                        />
                        {errors.email && <span>{errors.email.message}</span>}

                        <input 
                            {...register("password", { 
                                required: "Password is required", 
                                maxLength: { value: 30, message: "Password cannot be more than 30 characters" },
                                minLength: { value: 3, message: "Password cannot be less than 3 characters"}
                            })} 
                            type="password"
                            placeholder="Password"
                        />
                        {errors.password && <span>{errors.password.message}</span>}

                        <input 
                            type="submit" 
                            value={loading ? "Signing up..." : "Sign up"}
                            disabled={loading}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}

