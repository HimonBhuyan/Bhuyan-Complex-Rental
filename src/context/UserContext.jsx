import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Update user data and sync with localStorage
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Dispatch custom event for real-time updates across tabs
    window.dispatchEvent(
      new CustomEvent("userUpdated", {
        detail: updatedUser,
      })
    );
  };

  // Update profile data specifically
  const updateProfile = (profileData) => {
    const updatedUser = {
      ...user,
      ...profileData,
      // Ensure profile photo is updated in user object
      profilePhoto: profileData.profilePhoto || user?.profilePhoto,
      // Update basic info
      name: profileData.fullName || profileData.name || user?.name,
      phone: profileData.phone || user?.phone,
      email: profileData.email || user?.email,
      roomNumber: profileData.roomNumber || user?.roomNumber,
      // Store full profile data for persistence
      profileData: {
        ...user?.profileData,
        ...profileData,
      },
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Also save to separate profile storage for persistence
    if (user?.id && user?.role) {
      const profileKey = `profile_${user.id}_${user.role}`;
      localStorage.setItem(profileKey, JSON.stringify(profileData));
    }

    // Save profile photo to dedicated storage if provided
    if (profileData.profilePhoto && user?.id) {
      const photoKey = `userProfilePhoto_${user.id}`;
      localStorage.setItem(photoKey, profileData.profilePhoto);
    }

    // Dispatch custom event for real-time updates
    window.dispatchEvent(
      new CustomEvent("userUpdated", {
        detail: updatedUser,
      })
    );
  };

  // Login function
  const login = (userData) => {
    // Try to load extended profile data if it exists
    const profileKey = `profile_${userData.id}_${userData.role}`;
    const savedProfile = localStorage.getItem(profileKey);

    // Also try to load profile photo from dedicated storage
    const photoKey = `userProfilePhoto_${userData.id}`;
    const savedPhoto = localStorage.getItem(photoKey);

    let enhancedUserData = userData;
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        enhancedUserData = {
          ...userData,
          ...profileData,
          // Ensure basic info is updated
          name: profileData.fullName || userData.name,
          phone: profileData.phone || userData.phone,
          email: profileData.email || userData.email,
          roomNumber: profileData.roomNumber || userData.roomNumber,
          profilePhoto:
            profileData.profilePhoto || savedPhoto || userData.profilePhoto,
          profileData: profileData,
        };
      } catch (error) {
        console.error("Error loading saved profile:", error);
      }
    } else if (savedPhoto) {
      // If no full profile data but photo exists, load just the photo
      enhancedUserData = {
        ...userData,
        profilePhoto: savedPhoto,
      };
    }

    setUser(enhancedUserData);
    localStorage.setItem("user", JSON.stringify(enhancedUserData));

    window.dispatchEvent(
      new CustomEvent("userUpdated", {
        detail: enhancedUserData,
      })
    );
  };

  // Logout function
  const logout = () => {
    console.log('🚪 [UserContext] Logging out user...');
    
    // Clear user state
    setUser(null);
    
    // Clear all authentication and user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Clear any cached profile data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('profile_') || 
          key.startsWith('userProfilePhoto_') || 
          key.startsWith('ownerProfile') || 
          key.startsWith('tenantProfile') || 
          key.includes('LastUpdated')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ [UserContext] User logged out and localStorage cleared');
    
    // Dispatch logout event
    window.dispatchEvent(
      new CustomEvent("userUpdated", {
        detail: null,
      })
    );
    
    // Also dispatch a logout event for other components to handle
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
  };

  // Listen for user updates from other tabs/windows and owner/tenant WS updates
  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail) {
        setUser(event.detail);
      } else {
        setUser(null);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "user") {
        if (event.newValue) {
          try {
            const updatedUser = JSON.parse(event.newValue);
            setUser(updatedUser);
          } catch (error) {
            console.error("Error parsing updated user data:", error);
          }
        } else {
          setUser(null);
        }
      }
    };

    // When owner profile is updated via WebSocket, reflect in user (if owner)
    const handleOwnerProfileUpdated = (event) => {
      const payload = event?.detail;
      if (!payload) return;
      setUser((prev) => {
        if (!prev || prev.role !== "owner") return prev;
        const merged = {
          ...prev,
          name: payload.name || prev.name,
          email: payload.email || prev.email,
          phone: payload.phone || prev.phone,
          profilePhoto: payload.profilePhoto || prev.profilePhoto,
          address: payload.address || prev.address,
          profileData: payload.profileData
            ? { ...prev.profileData, ...payload.profileData }
            : prev.profileData,
        };
        localStorage.setItem("user", JSON.stringify(merged));
        return merged;
      });
    };

    // When tenant profile is updated via WebSocket, reflect in user (if tenant)
    const handleTenantProfileUpdated = (event) => {
      const payload = event?.detail;
      if (!payload) return;
      setUser((prev) => {
        if (!prev || prev.role !== "tenant") return prev;
        // Only update if it is the same logged-in tenant
        if (payload.userId && payload.userId !== prev.id) return prev;
        const merged = {
          ...prev,
          name: payload.name || payload.fullName || prev.name,
          email: payload.email || prev.email,
          phone: payload.phone || prev.phone,
          profilePhoto: payload.profilePhoto || prev.profilePhoto,
          room: payload.room || prev.room,
          roomNumber: payload.roomNumber || prev.roomNumber,
          profileData: payload.profileData
            ? { ...prev.profileData, ...payload.profileData }
            : prev.profileData,
        };
        localStorage.setItem("user", JSON.stringify(merged));
        return merged;
      });
    };

    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("ownerProfileUpdated", handleOwnerProfileUpdated);
    window.addEventListener("OWNER_PROFILE_UPDATED", handleOwnerProfileUpdated);
    window.addEventListener("tenantProfileUpdated", handleTenantProfileUpdated);
    window.addEventListener(
      "TENANT_PROFILE_UPDATED",
      handleTenantProfileUpdated
    );

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "ownerProfileUpdated",
        handleOwnerProfileUpdated
      );
      window.removeEventListener(
        "OWNER_PROFILE_UPDATED",
        handleOwnerProfileUpdated
      );
      window.removeEventListener(
        "tenantProfileUpdated",
        handleTenantProfileUpdated
      );
      window.removeEventListener(
        "TENANT_PROFILE_UPDATED",
        handleTenantProfileUpdated
      );
    };
  }, []);

  const value = {
    user,
    updateUser,
    updateProfile,
    login,
    logout,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
