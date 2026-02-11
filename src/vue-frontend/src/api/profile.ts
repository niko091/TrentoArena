import { IUserShared } from "@shared/types/User";

export const ProfileAPI = {
  async getCurrentUser(): Promise<IUserShared | null> {
    try {
      const res = await fetch("/auth/current_user");
      if (!res.ok) throw new Error("Auth error");
      return await res.json();
    } catch (e) {
      console.warn("Nessun utente loggato o errore auth:", e);
      return null;
    }
  },

  async getUserByUsername(username: string): Promise<IUserShared> {
    const res = await fetch(`/api/users/username/${username}`);
    if (!res.ok) throw new Error("User not found");
    return await res.json();
  },

  async getUserById(id: string): Promise<IUserShared> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error("User fetch error");
    return await res.json();
  },

  async getGames(participantId: string, isFinished: boolean): Promise<any[]> {
    try {
      const res = await fetch(
        `/api/games?participantId=${participantId}&isFinished=${isFinished}`,
      );
      return res.ok ? await res.json() : [];
    } catch (e) {
      console.error("Errore recupero partite:", e);
      return [];
    }
  },

  async sendFriendRequest(targetId: string, requesterId: string) {
    return await fetch(`/api/users/${targetId}/friend-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId }),
    });
  },

  async acceptFriendRequest(requesterId: string, currentUserId: string) {
    return await fetch(`/api/users/${currentUserId}/friends/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId }),
    });
  },

  async removeFriend(friendId: string, currentUserId: string) {
    return await fetch(`/api/users/${currentUserId}/friends/${friendId}`, {
      method: "DELETE",
    });
  },

  async sendReport(reporterId: string, reportedId: string, motivation: string) {
    return await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterId, reportedId, motivation }),
    });
  },

  async uploadProfilePicture(userId: string, file: File) {
    const formData = new FormData();
    formData.append("profilePicture", file);
    return await fetch(`/api/users/${userId}/profile-picture`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteProfilePicture(userId: string) {
    return await fetch(`/api/users/${userId}/profile-picture`, {
      method: "DELETE",
    });
  },
};
