"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
/** Shared appearance control for app pages without their own visible switch. */
export function GlobalThemeControl(){const [theme,setTheme]=useState<"dark"|"light">("dark");
 useEffect(()=>{setTheme(document.documentElement.dataset.theme==="light"?"light":"dark");
  const observer=new MutationObserver(()=>setTheme(document.documentElement.dataset.theme==="light"?"light":"dark"));
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});return()=>observer.disconnect();},[]);
 function toggle(){const next=theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;setTheme(next);try{localStorage.setItem("archeon-theme",next);}catch{}}
 return <button type="button" className="archeon-global-theme" title={theme==="dark"?"Use light mode":"Use dark mode"} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} onClick={toggle}>{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</button>;
}
