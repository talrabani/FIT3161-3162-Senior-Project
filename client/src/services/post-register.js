import axios from "axios";

export default function postRegister( userInfo ) {
    return axios.post(import.meta.env.VITE_POST_REGISTER, userInfo);
};