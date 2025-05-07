import axios from "axios";

const API_URL = import.meta.env.VITE_USER_API_URL;

const getPublicContent = () => {
    return axios.get(API_URL + "all");
};

const getUserBoard = () => {
    return axios.get(API_URL + "user");
};

const UserService = {
    getPublicContent,
    getUserBoard,
};

export default UserService;