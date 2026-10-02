

const MOCK_STORAGE_KEY = "filmzone_mock_users";

// Default accounts available right out of the box
// const DEFAULT_ACCOUNTS = [
//   {
//     id: "user_demo_1",
//     name: "Oudom Ratana",
//     email: "user@filmzone.com",
//     password: "password123",
//     role: "user",
//     avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oudom",
//     createdAt: "2025-01-15T08:00:00.000Z",
//   },
//   {
//     id: "admin_demo_1",
//     name: "Cinema Admin",
//     email: "admin@filmzone.com",
//     password: "admin123",
//     role: "admin",
//     avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
//     createdAt: "2025-01-01T08:00:00.000Z",
//   },
// ];

export const getStoredUsers = () => {
  try {
    const local = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!local) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(local);
  } catch (error) {
    console.error("Error reading stored users:", error);
    return DEFAULT_ACCOUNTS;
  }
};

export const registerUser = ({ fullName, email, password }) => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail,
  );
  if (existingUser) {
    throw new Error("This email is already registered. Please log in.");
  }

  // Create new profile object
  const newUser = {
    id: `user_${Date.now()}`,
    name: fullName.trim(),
    email: normalizedEmail,
    password: password,
    role: "user",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      fullName.trim(),
    )}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));

  // Generate mock JWT session token
  const token = `mock_token_${newUser.id}_${Date.now()}`;

  // Safe profile copy (without password)
  const { password: _, ...userProfile } = newUser;

  return { token, user: userProfile };
};

export const loginUser = ({ email, password }) => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail && u.password === password,
  );

  if (!user) {
    throw new Error("Invalid email or password. Please try again.");
  }

  const token = `mock_token_${user.id}_${Date.now()}`;
  const { password: _, ...userProfile } = user;

  return { token, user: userProfile };
};

export const googleLogin = () => {
  const users = getStoredUsers();
  const googleEmail = "google.user@filmzone.com";

  let user = users.find((u) => u.email === googleEmail);
  if (!user) {
    user = {
      id: `user_google_${Date.now()}`,
      name: "Google Explorer",
      email: googleEmail,
      role: "user",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleExplorer",
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
  }

  const token = `mock_token_${user.id}_${Date.now()}`;
  const { password: _, ...userProfile } = user;

  return { token, user: userProfile };
};

export const updateStoredUser = (userId, data) => {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...data };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
    const { password: _, ...userProfile } = users[index];
    return userProfile;
  }
  return data;
};

export const deleteStoredUser = (userId) => {
  const users = getStoredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(filtered));
};


