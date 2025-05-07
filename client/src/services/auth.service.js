import axios from "axios";

const API_URL = import.meta.env.VITE_AUTH_API_URL;

const signup = (username, password) => {
    return axios.post(API_URL + "signup", { username, password });
};

const login = (username, password) => {
    return axios
        .post(API_URL + "login", { username, password })
        .then((res) => {
            if (res.data.token) {
                localStorage.setItem("user", JSON.stringify(res.data));
            }
            return res.data;
        });
};

const signout = () => {
    localStorage.removeItem("user");
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"));
};

const AuthService = {
    signup,
    login,
    signout,
    getCurrentUser,
};

export default AuthService;