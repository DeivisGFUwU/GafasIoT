import { supabase } from './supabaseClient';

export const authService = {
    async signInWithPassword(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        return data;
    },

    async signUpWithEmail(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        return data;
    },

    async resendConfirmationEmail(email: string) {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        if (error) {
            throw error;
        }
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
    },

    async getCurrentSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            throw error;
        }
        return session;
    },
};
