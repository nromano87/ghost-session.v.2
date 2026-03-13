#pragma once

#include "JuceHeader.h"
#include "PluginProcessor.h"
#include "../UI/GhostTheme.h"
#include "../UI/LoginPanel.h"
#include "../UI/ProjectListPanel.h"
#include "../UI/ProjectView.h"
#include "../UI/HeaderBar.h"
#include "../UI/CollaboratorPanel.h"

//==============================================================================
class GhostSessionEditor : public juce::AudioProcessorEditor,
                            public juce::Timer
{
public:
    explicit GhostSessionEditor(GhostSessionProcessor&);
    ~GhostSessionEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;
    void timerCallback() override;

private:
    GhostSessionProcessor& proc;
    GhostTheme theme;

    LoginPanel loginPanel;
    ProjectListPanel projectList;
    CollaboratorPanel collabPanel;
    std::unique_ptr<ProjectView> projectView;
    InvitePopup invitePopup;

    // Notification bell
    class BellButton : public juce::Component
    {
    public:
        int badgeCount = 0;
        std::function<void()> onClick;
        void paint(juce::Graphics&) override;
        void mouseUp(const juce::MouseEvent& e) override { if (e.mouseWasClicked() && onClick) onClick(); }
        void mouseEnter(const juce::MouseEvent&) override { hovered = true; repaint(); }
        void mouseExit(const juce::MouseEvent&) override { hovered = false; repaint(); }
    private:
        bool hovered = false;
    };
    BellButton notifButton;
    struct InviteItem
    {
        juce::String id;
        juce::String projectName;
        juce::String inviterName;
    };
    class NotificationPopup : public juce::Component
    {
    public:
        NotificationPopup();
        void paint(juce::Graphics&) override;
        void resized() override;
        void setInvites(const std::vector<InviteItem>& items);
        std::function<void(const juce::String& inviteId)> onAccept;
        std::function<void(const juce::String& inviteId)> onDecline;
    private:
        struct Row { InviteItem invite; juce::TextButton acceptBtn{"Accept"}, declineBtn{"X"}; };
        juce::OwnedArray<Row> rows;
        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(NotificationPopup)
    };
    NotificationPopup notifPopup;
    bool notifVisible = false;
    int notifCount = 0;
    void fetchInvitations();

    // Settings popup
    juce::TextButton settingsButton { "⚙" };
    class SettingsPopup : public juce::Component
    {
    public:
        SettingsPopup();
        void paint(juce::Graphics&) override;
        void resized() override;
        void setUserInfo(const juce::String& name, const juce::String& email);
        std::function<void()> onSignOut;
    private:
        juce::String userName, userEmail;
        juce::TextButton signOutButton { "Sign Out" };
        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(SettingsPopup)
    };
    SettingsPopup settingsPopup;
    bool settingsVisible = false;

    bool loggedIn = false;
    juce::String currentProjectId;
    juce::String currentProjectName;

    void showLoginView();
    void showMainView();
    void onLoginSuccess();
    void fetchProjects();
    void openProject(const juce::String& id, const juce::String& name);
    void fetchProjectTracks();
    void handleFileDrop(const juce::File& file, const juce::String& ext);

    // Persist local file mappings per project across view recreations
    // Key: projectId -> (stemNameLower -> File)
    std::map<juce::String, std::map<juce::String, juce::File>> projectFileMap;
    void saveFileMap();
    void loadFileMap();
    static juce::File getFileMapPath();

    static constexpr int kSidebarW = 200;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(GhostSessionEditor)
};
