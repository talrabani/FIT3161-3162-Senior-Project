import { LoginInput, LoginButton } from './style.jsx';
import './style.css';

export default function LoginForm ({}) {

    return (
        <div className="login-form">
            <div className="login-form__content">
                <div className="login-form__heading">Sign in</div>
                <div className="login-form__create-account">or create an account</div>
                <div className="login-form__inputs">
                    <LoginInput id="username-input" label="Username" variant="filled"/>
                    <LoginInput id="password-input" label="Password" variant="filled"/>
                </div>
                <LoginButton variant="contained">Sign in</LoginButton>
            </div>
        </div>
    )
}

