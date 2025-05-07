import { styled, Button, TextField } from "@mui/material";

export const LoginInput = styled(TextField)`
    width: 100%;
    border: 1px solid black;
    border-radius: 10px;
    padding: 10px;
    background-color: white;

    & .MuiFilledInput-root {
        background-color: white;
        &:before { border-bottom: none; }
        &:after { border-bottom: none; }
        &:hover:before { border-bottom: none; }
    }
`;

export const LoginButton = styled(Button)`
    width: 100%;
    text-transform: none;
    font-size: 16px;
    border-radius: 36px;
    padding: 10px;
    box-shadow: none;
`;