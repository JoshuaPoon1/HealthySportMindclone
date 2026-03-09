import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },

  welcome: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: 30,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },

  infoCard: {
    backgroundColor: "#f9fafb",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    width: "48%",
  },

  cardTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  cardValue: {
    fontSize: 18,
  },

  cardSubtitle: {
    color: "#6b7280",
  },

  newsCard: {
    marginTop: 10,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },

  articleCard: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 20,
  },

  articleImage: {
    width: "100%",
    aspectRatio: 5 / 2,
    borderRadius: 10,
    marginBottom: 10,
  },

  articleTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  articleDescription: {
    color: "#6b7280",
    marginBottom: 10,
  },

  readMoreButton: {
    alignSelf: "flex-start",
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },

  readMoreText: {
    color: "white",
    fontWeight: "600",
  },
  
  imageWrapper: {
  width: "50%",
  height: 200,
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 10,
},
  logoutButton: {
      backgroundColor: "#ef4444",
      paddingVertical:10,
      paddingHorizontal: 18,
      borderRadius: 6,
    },
  logoutText: {  
      color: "white",
      fontWeight: "800",
    },
  
  checkInButton: {
    marginTop: 12,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  checkInButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  checkInNotesInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: "top",
    backgroundColor: "white",
    color: "#111827",
  },

  moodRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  moodButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  moodButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  modalCloseButton: {
    marginTop: 14,
    backgroundColor: "#6b7280",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
});