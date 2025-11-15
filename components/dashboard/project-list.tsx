"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Folder, Trash2, FileText, Image, Music, Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    assets: number;
  };
}

interface ProjectListProps {
  initialProjects: Project[];
}

export default function ProjectList({ initialProjects }: ProjectListProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        }),
      });

      if (response.ok) {
        const { project } = await response.json();
        router.push(`/dashboard/projects/${project.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
      setShowNewProjectModal(false);
      setNewProjectName("");
      setNewProjectDescription("");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects(projects.filter((p) => p.id !== projectId));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first project to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <h3 className="text-xl font-semibold mb-1 hover:text-blue-600">
                      {project.name}
                    </h3>
                  </Link>
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4" />
                <span>{project._count.assets} assets</span>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input"
                  placeholder="My Creative Project"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="What is this project about?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createProject}
                  disabled={loading || !newProjectName.trim()}
                  className="btn btn-primary flex-1"
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
