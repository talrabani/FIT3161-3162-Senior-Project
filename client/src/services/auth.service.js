import axios from "axios";

const API_URL = import.meta.env.VITE_AUTH_API_URL;

const signup = (username, password, email, units = 'metric') => {
    return axios.post(API_URL + "signup", { username, password, email, units });
};

const login = (email, password) => {
    return axios
        .post(API_URL + "login", { email, password })
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

const getUserInfo = async () => {
    const user = getCurrentUser();
    if (!user || !user.token) {
        return null;
    }
    
    try {
        const response = await axios.get(API_URL + "user", {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching user information:", error);
        return null;
    }
};

const updateUserPreferences = async (preferences) => {
    const user = getCurrentUser();
    if (!user || !user.token) {
        throw new Error("User not authenticated");
    }
    
    try {
        const response = await axios.put(API_URL + "user/preferences", preferences, {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });
        
        // Update local storage with new user data
        if (response.data) {
            const currentUser = getCurrentUser();
            const updatedUser = {
                ...currentUser,
                user: {
                    ...currentUser.user,
                    username: response.data.username,
                    units: response.data.units
                }
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        return response.data;
    } catch (error) {
        console.error("Error updating user preferences:", error);
        throw error;
    }
};

const AuthService = {
    signup,
    login,
    signout,
    getCurrentUser,
    getUserInfo,
    updateUserPreferences,
};

export default AuthService;