#include "PluginEditor.h"

//==============================================================================
// BellButton
//==============================================================================
void GhostSessionEditor::BellButton::paint(juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat().reduced(4.0f);
    float cx = bounds.getCentreX();
    float cy = bounds.getCentreY();
    float size = juce::jmin(bounds.getWidth(), bounds.getHeight());

    auto colour = hovered ? GhostColours::ghostPurple : GhostColours::textSecondary;
    g.setColour(colour);

    // Bell body - draw using a path
    juce::Path bell;
    float bw = size * 0.5f;   // bell width
    float bh = size * 0.5f;   // bell height
    float top = cy - bh * 0.5f;

    // Bell dome (rounded top)
    bell.addArc(cx - bw * 0.5f, top, bw, bh * 0.7f, juce::MathConstants<float>::pi, 0.0f, true);
    // Bell sides flare out
    bell.lineTo(cx + bw * 0.65f, top + bh * 0.85f);
    // Bottom rim
    bell.lineTo(cx - bw * 0.65f, top + bh * 0.85f);
    bell.closeSubPath();

    g.fillPath(bell);

    // Bell rim bar
    g.fillRoundedRectangle(cx - bw * 0.7f, top + bh * 0.8f, bw * 1.4f, size * 0.1f, 2.0f);

    // Clapper (little circle at bottom)
    g.fillEllipse(cx - size * 0.06f, top + bh * 0.95f, size * 0.12f, size * 0.12f);

    // Badge count
    if (badgeCount > 0)
    {
        float badgeR = 7.0f;
        float bx = cx + bw * 0.4f;
        float by = top - 1.0f;
        g.setColour(juce::Colour(0xFFFF4444));
        g.fillEllipse(bx - badgeR, by - badgeR, badgeR * 2, badgeR * 2);
        g.setColour(juce::Colours::white);
        g.setFont(juce::Font(9.0f, juce::Font::bold));
        g.drawText(juce::String(badgeCount), (int)(bx - badgeR), (int)(by - badgeR),
                   (int)(badgeR * 2), (int)(badgeR * 2), juce::Justification::centred);
    }
}

//==============================================================================
// NotificationPopup
//==============================================================================
GhostSessionEditor::NotificationPopup::NotificationPopup() {}

void GhostSessionEditor::NotificationPopup::paint(juce::Graphics& g)
{
    g.setColour(GhostColours::surface);
    g.fillRoundedRectangle(getLocalBounds().toFloat(), 8.0f);
    g.setColour(GhostColours::border);
    g.drawRoundedRectangle(getLocalBounds().toFloat(), 8.0f, 1.0f);

    g.setColour(GhostColours::textSecondary);
    g.setFont(juce::Font(10.0f, juce::Font::bold));
    g.drawText("INVITATIONS", 16, 10, getWidth() - 32, 14, juce::Justification::centredLeft);

    g.setColour(GhostColours::border);
    g.drawLine(12.0f, 28.0f, (float)getWidth() - 12.0f, 28.0f, 0.5f);

    if (rows.isEmpty())
    {
        g.setColour(GhostColours::textMuted);
        g.setFont(juce::Font(11.0f, juce::Font::italic));
        g.drawText("No pending invitations", getLocalBounds().withTrimmedTop(28),
                   juce::Justification::centred);
    }
    else
    {
        int y = 34;
        for (auto* row : rows)
        {
            // Inviter name
            g.setColour(GhostColours::ghostGreen);
            g.setFont(juce::Font(11.0f, juce::Font::bold));
            g.drawText(row->invite.inviterName, 16, y, getWidth() - 130, 14,
                       juce::Justification::centredLeft);
            // Project name
            g.setColour(GhostColours::textMuted);
            g.setFont(juce::Font(10.0f));
            g.drawText("invited you to " + row->invite.projectName, 16, y + 16, getWidth() - 130, 14,
                       juce::Justification::centredLeft);

            // Divider
            g.setColour(GhostColours::border.withAlpha(0.3f));
            g.drawLine(12.0f, (float)(y + 48), (float)getWidth() - 12.0f, (float)(y + 48), 0.5f);
            y += 50;
        }
    }
}

void GhostSessionEditor::NotificationPopup::resized()
{
    int y = 34;
    for (auto* row : rows)
    {
        row->acceptBtn.setBounds(getWidth() - 110, y + 2, 56, 22);
        row->declineBtn.setBounds(getWidth() - 48, y + 2, 34, 22);
        y += 50;
    }
}

void GhostSessionEditor::NotificationPopup::setInvites(const std::vector<InviteItem>& items)
{
    // Remove old button components
    for (auto* row : rows)
    {
        removeChildComponent(&row->acceptBtn);
        removeChildComponent(&row->declineBtn);
    }
    rows.clear();

    for (auto& inv : items)
    {
        auto* row = new Row();
        row->invite = inv;
        row->acceptBtn.onClick = [this, id = inv.id] { if (onAccept) onAccept(id); };
        row->declineBtn.onClick = [this, id = inv.id] { if (onDecline) onDecline(id); };
        addAndMakeVisible(row->acceptBtn);
        addAndMakeVisible(row->declineBtn);
        rows.add(row);
    }
    resized();
    repaint();
}

//==============================================================================
// SettingsPopup
//==============================================================================
GhostSessionEditor::SettingsPopup::SettingsPopup()
{
    signOutButton.onClick = [this] { if (onSignOut) onSignOut(); };
    addAndMakeVisible(signOutButton);
}

void GhostSessionEditor::SettingsPopup::paint(juce::Graphics& g)
{
    g.setColour(GhostColours::surface);
    g.fillRoundedRectangle(getLocalBounds().toFloat(), 8.0f);
    g.setColour(GhostColours::border);
    g.drawRoundedRectangle(getLocalBounds().toFloat(), 8.0f, 1.0f);

    // Title
    g.setColour(GhostColours::textSecondary);
    g.setFont(juce::Font(10.0f, juce::Font::bold));
    g.drawText("ACCOUNT", 16, 10, getWidth() - 32, 14, juce::Justification::centredLeft);

    // Divider
    g.setColour(GhostColours::border);
    g.drawLine(12.0f, 30.0f, (float)getWidth() - 12.0f, 30.0f, 0.5f);

    // User avatar circle
    g.setColour(GhostColours::ghostGreen.withAlpha(0.2f));
    g.fillEllipse(16.0f, 40.0f, 36.0f, 36.0f);
    g.setColour(GhostColours::ghostGreen);
    g.drawEllipse(16.0f, 40.0f, 36.0f, 36.0f, 1.5f);
    g.setFont(juce::Font(14.0f, juce::Font::bold));
    auto initial = userName.isNotEmpty() ? userName.substring(0, 1).toUpperCase() : "?";
    g.drawText(initial, 16, 40, 36, 36, juce::Justification::centred);

    // Name
    g.setColour(GhostColours::textPrimary);
    g.setFont(juce::Font(13.0f, juce::Font::bold));
    g.drawText(userName.isEmpty() ? "Unknown" : userName, 60, 40, getWidth() - 76, 18, juce::Justification::centredLeft);

    // Email
    g.setColour(GhostColours::textMuted);
    g.setFont(juce::Font(10.0f));
    g.drawText(userEmail.isEmpty() ? "" : userEmail, 60, 58, getWidth() - 76, 14, juce::Justification::centredLeft);
}

void GhostSessionEditor::SettingsPopup::resized()
{
    signOutButton.setBounds(16, getHeight() - 42, getWidth() - 32, 28);
}

void GhostSessionEditor::SettingsPopup::setUserInfo(const juce::String& name, const juce::String& email)
{
    userName = name;
    userEmail = email;
    repaint();
}

//==============================================================================
GhostSessionEditor::GhostSessionEditor(GhostSessionProcessor& p)
    : AudioProcessorEditor(&p), proc(p), collabPanel(p)
{
    setLookAndFeel(&theme);

    // --- Login panel ---
    loginPanel.onLogin = [this](const juce::String& email, const juce::String& password) {
        loginPanel.setLoading(true);
        loginPanel.setError({});
        proc.getClient().login(email, password,
            [this, email](bool success, const juce::var& resp) {
                juce::MessageManager::callAsync([this, success, resp, email]() {
                    loginPanel.setLoading(false);
                    if (success)
                    {
                        // Save user profile from response
                        ProducerProfile profile;
                        auto user = resp["user"];
                        if (user.isObject())
                        {
                            profile.userId = user["id"].toString();
                            profile.displayName = user["displayName"].toString();
                        }
                        if (profile.displayName.isEmpty()) profile.displayName = email;
                        profile.isOnline = true;
                        profile.colour = juce::Colour(0xFF00FFC8);
                        proc.getAppState().setCurrentUser(profile);
                        onLoginSuccess();
                    }
                    else
                    {
                        auto msg = resp.isObject() ? resp["message"].toString() : juce::String("Login failed");
                        loginPanel.setError(msg.isEmpty() ? "Login failed" : msg);
                    }
                });
            });
    };

    loginPanel.onRegister = [this](const juce::String& email, const juce::String& password, const juce::String& name) {
        loginPanel.setLoading(true);
        loginPanel.setError({});
        proc.getClient().registerUser(email, password, name,
            [this, email, name](bool success, const juce::var& resp) {
                juce::MessageManager::callAsync([this, success, resp, email, name]() {
                    loginPanel.setLoading(false);
                    if (success)
                    {
                        // Save user profile from response
                        ProducerProfile profile;
                        auto user = resp["user"];
                        if (user.isObject())
                        {
                            profile.userId = user["id"].toString();
                            profile.displayName = user["displayName"].toString();
                        }
                        if (profile.displayName.isEmpty()) profile.displayName = name.isNotEmpty() ? name : email;
                        profile.isOnline = true;
                        profile.colour = juce::Colour(0xFF00FFC8);
                        proc.getAppState().setCurrentUser(profile);
                        onLoginSuccess();
                    }
                    else
                    {
                        auto msg = resp.isObject() ? resp["message"].toString() : juce::String("Registration failed");
                        loginPanel.setError(msg.isEmpty() ? "Registration failed" : msg);
                    }
                });
            });
    };
    addAndMakeVisible(loginPanel);

    // --- Project list (left sidebar) ---
    projectList.onProjectSelected = [this](const ProjectListPanel::ProjectItem& item) {
        openProject(item.id, item.name);
    };

    projectList.onCreateClicked = [this] {
        proc.getClient().createProject("New Project", 140.0, "C",
            [this](bool ok, const juce::var&) {
                if (ok) juce::MessageManager::callAsync([this]() { fetchProjects(); });
            });
    };

    projectList.onDeleteProject = [this](const ProjectListPanel::ProjectItem& item) {
        proc.getClient().deleteProject(item.id,
            [this, deletedId = item.id](bool ok, const juce::var&) {
                if (!ok) return;
                juce::MessageManager::callAsync([this, deletedId]() {
                    // Clear current view if we deleted the active project
                    if (currentProjectId == deletedId)
                    {
                        projectView = nullptr;
                        currentProjectId = {};
                        currentProjectName = {};
                        repaint();
                    }
                    // Remove from file map
                    projectFileMap.erase(deletedId);
                    saveFileMap();
                    fetchProjects();
                });
            });
    };
    addChildComponent(projectList);

    // --- Collaborator panel (below project list) ---
    addChildComponent(collabPanel);

    // --- Invite popup ---
    invitePopup.onInvite = [this](const juce::String& email, const juce::String& name, const juce::String& role) {
        if (currentProjectId.isEmpty()) return;
        proc.getClient().inviteMember(currentProjectId, email, name, role,
            [this](bool ok, const juce::var& resp) {
                juce::MessageManager::callAsync([this, ok, resp]() {
                    if (ok)
                        invitePopup.setSuccess("Invited!");
                    else
                    {
                        auto msg = resp.isObject() ? resp["error"].toString() : juce::String("Invite failed");
                        invitePopup.setError(msg.isEmpty() ? "Invite failed" : msg);
                    }
                });
            });
    };
    addChildComponent(invitePopup);

    // --- Notification bell (top-right) ---
    notifButton.onClick = [this] {
        notifVisible = !notifVisible;
        notifPopup.setVisible(notifVisible);
        if (notifVisible)
        {
            notifPopup.toFront(true);
            fetchInvitations();
        }
    };
    addChildComponent(notifButton);

    notifPopup.onAccept = [this](const juce::String& inviteId) {
        proc.getClient().acceptInvitation(inviteId,
            [this](bool ok, const juce::var&) {
                if (ok)
                {
                    juce::MessageManager::callAsync([this]() {
                        fetchInvitations();
                        fetchProjects();  // Refresh project list since we joined a new one
                    });
                }
            });
    };
    notifPopup.onDecline = [this](const juce::String& inviteId) {
        proc.getClient().declineInvitation(inviteId,
            [this](bool ok, const juce::var&) {
                if (ok)
                    juce::MessageManager::callAsync([this]() { fetchInvitations(); });
            });
    };
    addChildComponent(notifPopup);

    // --- Settings button (top-right gear icon) ---
    settingsButton.onClick = [this] {
        settingsVisible = !settingsVisible;
        settingsPopup.setVisible(settingsVisible);
        if (settingsVisible)
        {
            auto user = proc.getAppState().getCurrentUser();
            settingsPopup.setUserInfo(user.displayName, user.userId);
            settingsPopup.toFront(true);
        }
    };
    addChildComponent(settingsButton);

    settingsPopup.onSignOut = [this] {
        settingsVisible = false;
        settingsPopup.setVisible(false);
        proc.getAppState().setAuthToken({});
        proc.getClient().setAuthToken({});
        currentProjectId = {};
        currentProjectName = {};
        projectView = nullptr;
        showLoginView();
    };
    addChildComponent(settingsPopup);

    setResizable(true, true);
    setResizeLimits(900, 500, 1920, 1200);
    setSize(1100, 720);

    loadFileMap();

    if (proc.getClient().isLoggedIn())
        onLoginSuccess();
    else
        showLoginView();
}

GhostSessionEditor::~GhostSessionEditor()
{
    saveFileMap();
    stopTimer();
    setLookAndFeel(nullptr);
}

void GhostSessionEditor::paint(juce::Graphics& g)
{
    g.fillAll(GhostColours::background);

    // Empty state when no project is selected
    if (loggedIn && !projectView)
    {
        auto area = getLocalBounds().withLeft(kSidebarW);
        g.setColour(GhostColours::textMuted);
        g.setFont(juce::Font(16.0f, juce::Font::italic));
        g.drawText("Select a project or create a new one",
                   area, juce::Justification::centred);
    }
}

void GhostSessionEditor::resized()
{
    auto bounds = getLocalBounds();

    if (!loggedIn)
    {
        loginPanel.setBounds(bounds);
        return;
    }

    auto sidebar = bounds.removeFromLeft(kSidebarW);
    int collabH = 200;  // height for collaborator panel
    projectList.setBounds(sidebar.removeFromTop(sidebar.getHeight() - collabH));
    collabPanel.setBounds(sidebar);

    if (projectView)
        projectView->setBounds(bounds);

    // Notification bell (top-right, left of settings)
    notifButton.setBounds(getWidth() - 72, 8, 30, 30);

    // Notification popup (below bell)
    int notifH = juce::jmax(80, 34 + notifCount * 50);
    notifPopup.setBounds(getWidth() - 300, 44, 280, notifH);

    // Settings button (top-right)
    settingsButton.setBounds(getWidth() - 38, 8, 30, 30);

    // Settings popup (below button)
    settingsPopup.setBounds(getWidth() - 220, 44, 210, 130);

    // Invite popup
    int popupW = 300, popupH = 200;
    invitePopup.setBounds(getWidth() - popupW - 16, 56, popupW, popupH);
}

void GhostSessionEditor::timerCallback()
{
    // Periodic refresh of project data
    if (currentProjectId.isNotEmpty())
        fetchProjectTracks();

    // Poll for new invitations
    fetchInvitations();
}

void GhostSessionEditor::showLoginView()
{
    loggedIn = false;
    loginPanel.setVisible(true);
    projectList.setVisible(false);
    collabPanel.setVisible(false);
    notifButton.setVisible(false);
    notifPopup.setVisible(false);
    notifVisible = false;
    settingsButton.setVisible(false);
    settingsPopup.setVisible(false);
    settingsVisible = false;
    projectView = nullptr;
    resized();
}

void GhostSessionEditor::showMainView()
{
    loggedIn = true;
    loginPanel.setVisible(false);
    projectList.setVisible(true);
    collabPanel.setVisible(true);
    notifButton.setVisible(true);
    settingsButton.setVisible(true);
    resized();
}

void GhostSessionEditor::onLoginSuccess()
{
    showMainView();
    fetchProjects();
    fetchInvitations();
    startTimer(10000);
}

void GhostSessionEditor::fetchProjects()
{
    proc.getClient().getProjects([this](bool ok, const juce::var& data) {
        if (!ok || !data.isArray()) return;

        juce::MessageManager::callAsync([this, data]() {
            std::vector<ProjectListPanel::ProjectItem> items;
            for (int i = 0; i < data.size(); ++i)
            {
                auto p = data[i];
                ProjectListPanel::ProjectItem item;
                item.id = p["id"].toString();
                item.name = p["name"].toString();
                item.tempo = static_cast<double>(p["tempo"]);
                item.key = p["key"].toString();
                if (item.tempo <= 0) item.tempo = 140.0;
                if (item.key.isEmpty()) item.key = "C";
                items.push_back(item);
            }
            projectList.setProjects(items);

            // Auto-select first project if none selected
            if (currentProjectId.isEmpty() && !items.empty())
            {
                projectList.setSelectedId(items[0].id);
                openProject(items[0].id, items[0].name);
            }
        });
    });
}

void GhostSessionEditor::openProject(const juce::String& id, const juce::String& name)
{
    currentProjectId = id;
    currentProjectName = name;

    // Create fresh project view, restoring any saved local file mappings
    projectView = std::make_unique<ProjectView>(proc);
    addAndMakeVisible(*projectView);
    projectView->setProjectName(name);

    // Restore persisted local file map for this project
    auto it = projectFileMap.find(id);
    if (it != projectFileMap.end())
    {
        projectView->setLocalFileMap(it->second);

        // Restore bounce file if saved
        auto bounceIt = it->second.find("__bounce__");
        if (bounceIt != it->second.end() && bounceIt->second.existsAsFile())
            projectView->setBounceFile(bounceIt->second);
    }

    // Wire up callbacks
    projectView->onInviteClicked = [this] {
        bool show = !invitePopup.isVisible();
        invitePopup.setVisible(show);
        if (show)
        {
            invitePopup.reset();
            invitePopup.toFront(true);
        }
    };

    projectView->onFileDropped = [this](const juce::File& file, const juce::String& ext) {
        // Persist the local file mapping for this project
        auto stemName = file.getFileNameWithoutExtension().toLowerCase();
        projectFileMap[currentProjectId][stemName] = file;
        saveFileMap();
        handleFileDrop(file, ext);
    };

    projectView->onBounceSet = [this](const juce::File& file) {
        projectFileMap[currentProjectId]["__bounce__"] = file;
        saveFileMap();
    };

    projectView->onBounceCleared = [this] {
        projectFileMap[currentProjectId].erase("__bounce__");
        saveFileMap();
    };

    projectView->onDeleteStem = [this](const juce::String& trackId) {
        if (currentProjectId.isEmpty()) return;
        proc.getClient().deleteTrack(currentProjectId, trackId,
            [this](bool ok, const juce::var&) {
                if (ok) juce::MessageManager::callAsync([this]() { fetchProjectTracks(); });
            });
    };

    // Chat send
    projectView->getChat().onSendMessage = [this](const juce::String& text) {
        proc.getSessionManager().sendChatMessage(text);
        auto user = proc.getAppState().getCurrentUser();
        projectView->getChat().addMessage(
            user.displayName.isEmpty() ? "You" : user.displayName,
            text, GhostColours::ghostGreen);
    };

    resized();

    // Ensure buttons stay on top of project view
    notifButton.toFront(false);
    notifPopup.toFront(false);
    settingsButton.toFront(false);
    settingsPopup.toFront(false);
    invitePopup.toFront(false);

    fetchProjectTracks();
}

void GhostSessionEditor::fetchInvitations()
{
    proc.getClient().getInvitations([this](bool ok, const juce::var& data) {
        if (!ok || !data.isArray()) return;

        juce::MessageManager::callAsync([this, data]() {
            std::vector<InviteItem> items;
            for (int i = 0; i < data.size(); ++i)
            {
                auto inv = data[i];
                InviteItem item;
                item.id = inv["id"].toString();
                item.projectName = inv["projectName"].toString();
                item.inviterName = inv["inviterName"].toString();
                items.push_back(item);
            }
            notifCount = (int)items.size();
            notifPopup.setInvites(items);

            // Update bell badge count
            notifButton.badgeCount = notifCount;
            notifButton.repaint();

            resized();
        });
    });
}

void GhostSessionEditor::fetchProjectTracks()
{
    if (currentProjectId.isEmpty() || !projectView) return;

    proc.getClient().getTracks(currentProjectId,
        [this](bool ok, const juce::var& data) {
            if (!ok || !data.isArray()) return;

            juce::MessageManager::callAsync([this, data]() {
                if (!projectView) return;

                std::vector<StemRow::StemInfo> stems;
                for (int i = 0; i < data.size(); ++i)
                {
                    auto item = data[i];
                    StemRow::StemInfo stem;
                    stem.id = item["id"].toString();
                    stem.name = item["name"].toString();
                    stem.ownerName = item["ownerName"].toString();
                    stem.type = item["type"].toString();
                    stem.muted = static_cast<bool>(item["muted"]);
                    stem.soloed = static_cast<bool>(item["soloed"]);

                    auto vol = item["volume"];
                    stem.volume = vol.isVoid() ? 0.8f : static_cast<float>(static_cast<double>(vol));

                    if (stem.type.isEmpty()) stem.type = "audio";
                    stems.push_back(stem);
                }
                projectView->setStems(stems);
            });
        });

    // Update tempo/key labels
    proc.getClient().getProject(currentProjectId,
        [this](bool ok, const juce::var& data) {
            if (!ok) return;
            juce::MessageManager::callAsync([this, data]() {
                if (!projectView) return;
                auto tempo = static_cast<double>(data["tempo"]);
                auto key = data["key"].toString();
                projectView->setProjectName(
                    currentProjectName + "   " +
                    juce::String(tempo > 0 ? tempo : 140.0, 0) + " BPM  |  " +
                    (key.isEmpty() ? "C" : key));
            });
        });
}

void GhostSessionEditor::handleFileDrop(const juce::File& file, const juce::String& ext)
{
    if (currentProjectId.isEmpty()) return;

    // Upload the file as a session file
    proc.getClient().uploadSession(currentProjectId, file,
        [this](bool ok, const juce::var&) {
            if (!ok) return;
            juce::MessageManager::callAsync([this]() {
                fetchProjectTracks();
            });
        });

    // Also create a track entry
    juce::String type = "audio";
    if (ext == ".mid" || ext == ".midi") type = "midi";

    proc.getClient().addTrack(currentProjectId, file.getFileNameWithoutExtension(), type,
        [this](bool ok, const juce::var&) {
            if (ok) juce::MessageManager::callAsync([this]() { fetchProjectTracks(); });
        });
}

juce::File GhostSessionEditor::getFileMapPath()
{
    auto dir = juce::File::getSpecialLocation(juce::File::userApplicationDataDirectory)
                   .getChildFile("GhostSession");
    dir.createDirectory();
    return dir.getChildFile("file_map.json");
}

void GhostSessionEditor::saveFileMap()
{
    auto root = std::make_unique<juce::DynamicObject>();
    for (auto& [projId, fileMap] : projectFileMap)
    {
        auto projObj = std::make_unique<juce::DynamicObject>();
        for (auto& [stemName, file] : fileMap)
        {
            if (file.existsAsFile())
                projObj->setProperty(stemName, file.getFullPathName());
        }
        root->setProperty(projId, projObj.release());
    }

    auto json = juce::JSON::toString(juce::var(root.release()));
    getFileMapPath().replaceWithText(json);
}

void GhostSessionEditor::loadFileMap()
{
    auto mapFile = getFileMapPath();
    if (!mapFile.existsAsFile()) return;

    auto json = juce::JSON::parse(mapFile.loadFileAsString());
    if (!json.isObject()) return;

    if (auto* obj = json.getDynamicObject())
    {
        for (auto& prop : obj->getProperties())
        {
            auto projId = prop.name.toString();
            if (auto* projObj = prop.value.getDynamicObject())
            {
                for (auto& stemProp : projObj->getProperties())
                {
                    auto stemName = stemProp.name.toString();
                    auto filePath = stemProp.value.toString();
                    juce::File f(filePath);
                    if (f.existsAsFile())
                        projectFileMap[projId][stemName] = f;
                }
            }
        }
    }
}
