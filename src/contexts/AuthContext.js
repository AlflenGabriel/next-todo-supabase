"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      // Adicione esta lógica para criar o perfil se ele não existir
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // PGRST116 indica que nenhum registro foi encontrado
          // Perfil não existe, então crie um
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                username: user.email ? user.email.split("@")[0] : "", // Use o email como base para o username
              },
            ]);
          if (insertError) {
            console.error(
              "Erro ao criar perfil no login:",
              insertError.message
            );
          }
        } else if (profileError) {
          console.error(
            "Erro ao buscar perfil no login:",
            profileError.message
          );
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Repita a lógica de criação de perfil para mudanças de estado de autenticação
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: session.user.id,
                username: session.user.email
                  ? session.user.email.split("@")[0]
                  : "",
              },
            ]);
          if (insertError) {
            console.error(
              "Erro ao criar perfil na mudança de estado:",
              insertError.message
            );
          }
        } else if (profileError) {
          console.error(
            "Erro ao buscar perfil na mudança de estado:",
            profileError.message
          );
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
