'use client';

import { motion } from "motion/react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import SearchIcon from "../../../public/IconSearch24.svg";
import { useRef, useState } from "react";

export default function SearchBar({ className, placeholder="Search...", onChange, onSubmit }) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef();

    function handleFocus(){
        setIsFocused(true);
    }
    
    function handleBlur(){
        setIsFocused(false);
    }

    return (
        <motion.div className={twMerge("flex flex-row rounded-xl border border-no-focus-input transition-colors duration-150", isFocused && "border-brand", className)} onClick={() => inputRef.current.focus()}>
            <Image className="ml-2" src={SearchIcon} alt="Search" draggable={false} />
            <input 
                className="w-full pl-2 pr-4 pt-1.5 pb-2 outline-none" 
                ref={inputRef}
                placeholder={placeholder} 
                onFocus={handleFocus} 
                onBlur={handleBlur}
                onChange={onChange}
                onSubmit={onSubmit}
            />
        </motion.div>
    );
}