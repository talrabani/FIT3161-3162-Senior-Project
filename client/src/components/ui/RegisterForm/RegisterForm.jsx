import React, { useState } from 'react';
import { RegisterInput, RegisterButton } from './style.jsx';
import './style.css';

export default function RegisterForm ({}) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handleRegister = ( newUsername, newPassword ) => {
        postRegister( { username: newUsername, password: newPassword } )        
    }

    return (
        <div className="register-form">
            <div className="register-form__content">
                <div className="register-form__heading">Sign up</div>
                <div className="register-form__inputs">
                    <RegisterInput 
                        id="username-input" 
                        label="Username" 
                        variant="filled"
                        value={username}
                        onChange={(newUsername) => setUsername(newUsername)}
                    />
                    <RegisterInput 
                        id="password-input" 
                        label="Password" 
                        variant="filled"
                        value={password}
                        onChange={(newPassword) => setPassword(newPassword)}
                    />
                </div>
                <RegisterButton 
                    variant="contained"
                    onClick={() => handleRegister(username, password)}
                >
                    Sign up
                </RegisterButton>
            </div>
        </div>
    )
}

