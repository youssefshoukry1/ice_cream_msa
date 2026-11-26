"use client";
import {useEffect} from "react";

export default function MenuCartReceipt({attempt}) {
  useEffect(()=>{
    try {
      const saved=JSON.parse(sessionStorage.getItem("eistaxi-preview-attempt"));
      if (saved?.id===attempt && localStorage.getItem("eistaxi-menu-preview-cart-v1")===saved.cart) {
        localStorage.removeItem("eistaxi-menu-preview-cart-v1");
        sessionStorage.removeItem("eistaxi-preview-attempt");
      }
    } catch {}
  },[attempt]);
  return null;
}
