"use client";

import { BookOpen, Layers, MonitorPlay } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock Data Hierarchy
const communities = [
    {
        id: "com-1",
        name: "Porcinos",
        courses: [
            {
                id: "cur-1",
                name: "Manejo Integral",
                modules: [
                    {
                        id: "mod-1",
                        name: "Nutrición Básica",
                        lessons: [{ id: "l-1", title: "Introducción a la dieta" }, { id: "l-2", title: "Suplementos" }]
                    },
                    {
                        id: "mod-2",
                        name: "Sanidad",
                        lessons: [{ id: "l-3", title: "Vacunación" }]
                    }
                ]
            },
            {
                id: "cur-2",
                name: "Instalaciones",
                modules: [
                    {
                        id: "mod-3",
                        name: "Diseño de Corrales",
                        lessons: [{ id: "l-4", title: "Ventilación" }]
                    }
                ]
            }
        ]
    },
    {
        id: "com-2",
        name: "Bovinos",
        courses: [
            {
                id: "cur-3",
                name: "Producción de Leche",
                modules: [
                    {
                        id: "mod-4",
                        name: "Ordeño Mecánico",
                        lessons: [{ id: "l-5", title: "Mantenimiento de equipos" }]
                    }
                ]
            }
        ]
    },
    {
        id: "com-3",
        name: "Avicultura",
        courses: [
            {
                id: "cur-4",
                name: "Cría de Pollos",
                modules: [
                    {
                        id: "mod-5",
                        name: "Incubación",
                        lessons: [{ id: "l-6", title: "Control de temperatura" }]
                    }
                ]
            }
        ]
    }
];

export default function CursosPage() {
    return (
        <div className="max-w-6xl animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-6 w-6 text-white" />
                    <h1 className="text-2xl font-bold text-white">Catálogo de Cursos</h1>
                </div>
                <p className="text-[#888]">
                    Explora el contenido educativo organizado por comunidades.
                </p>
            </div>

            {/* Top Level Tabs */}
            <Tabs defaultValue="subido" className="w-full">
                <TabsList className="bg-[#0a0a0a] border border-[#333] w-full justify-start mb-6">
                    <TabsTrigger
                        value="subido"
                        className="data-[state=active]:bg-neon-blue data-[state=active]:text-black text-[#888] px-6"
                    >
                        Subido
                    </TabsTrigger>
                    <TabsTrigger
                        value="porsubir"
                        className="data-[state=active]:bg-neon-blue data-[state=active]:text-black text-[#888] px-6"
                    >
                        Por subir
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Subido (Existing Content) */}
                <TabsContent value="subido" className="animate-in fade-in-50">
                    <Tabs defaultValue={communities[0]?.id} className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Comunidades</h2>
                        </div>
                        <TabsList className="bg-[#0a0a0a] border border-[#333] w-full justify-start overflow-x-auto">
                            {communities.map((community) => (
                                <TabsTrigger
                                    key={community.id}
                                    value={community.id}
                                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[#888]"
                                >
                                    {community.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {communities.map((community) => (
                            <TabsContent key={community.id} value={community.id} className="mt-6 animate-in fade-in-50">

                                {/* Level 2: Courses */}
                                <div className="space-y-6">
                                    {community.courses.length > 0 ? (
                                        <Tabs defaultValue={community.courses[0]?.id} className="w-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Layers className="h-4 w-4 text-green-500" />
                                                <h3 className="text-md font-medium text-[#ccc]">Cursos en {community.name}</h3>
                                            </div>
                                            <TabsList className="bg-[#111] border border-[#333] justify-start h-auto flex-wrap gap-2 p-2">
                                                {community.courses.map((course) => (
                                                    <TabsTrigger
                                                        key={course.id}
                                                        value={course.id}
                                                        className="data-[state=active]:bg-[#333] data-[state=active]:text-white text-[#888] border border-transparent data-[state=active]:border-[#555]"
                                                    >
                                                        {course.name}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>

                                            {community.courses.map((course) => (
                                                <TabsContent key={course.id} value={course.id} className="mt-6 border-l-2 border-[#333] pl-6 ml-2">

                                                    {/* Level 3: Modules */}
                                                    {course.modules.length > 0 ? (
                                                        <Tabs defaultValue={course.modules[0]?.id} className="w-full">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <MonitorPlay className="h-4 w-4 text-blue-500" />
                                                                <h4 className="text-sm font-medium text-[#888]">Módulos de {course.name}</h4>
                                                            </div>
                                                            <TabsList className="bg-transparent p-0 gap-4 justify-start border-b border-[#333] rounded-none w-full h-auto">
                                                                {course.modules.map((module) => (
                                                                    <TabsTrigger
                                                                        key={module.id}
                                                                        value={module.id}
                                                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-500 px-0 py-2"
                                                                    >
                                                                        {module.name}
                                                                    </TabsTrigger>
                                                                ))}
                                                            </TabsList>

                                                            {course.modules.map((module) => (
                                                                <TabsContent key={module.id} value={module.id} className="mt-6">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                        {/* Mock Lessons Display */}
                                                                        {module.lessons.map((lesson) => (
                                                                            <Card key={lesson.id} className="bg-[#0a0a0a] border-[#333]">
                                                                                <CardHeader>
                                                                                    <CardTitle className="text-white text-base">{lesson.title}</CardTitle>
                                                                                    <CardDescription className="text-[#666]">
                                                                                        ID: {lesson.id}
                                                                                    </CardDescription>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <div className="p-3 rounded bg-[#111] border border-[#222]">
                                                                                        <p className="text-xs text-green-400 font-mono">
                                                                                            Lesson que pertenece a:<br />
                                                                                            <strong>Módulo:</strong> {module.name}<br />
                                                                                            <strong>Curso:</strong> {course.name}<br />
                                                                                            <strong>Comunidad:</strong> {community.name}
                                                                                        </p>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        ))}
                                                                    </div>
                                                                </TabsContent>
                                                            ))}
                                                        </Tabs>
                                                    ) : (
                                                        <p className="text-[#666] italic">No hay módulos disponibles en este curso.</p>
                                                    )}

                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    ) : (
                                        <p className="text-[#666] italic">No hay cursos disponibles en esta comunidad.</p>
                                    )}
                                </div>

                            </TabsContent>
                        ))}
                    </Tabs>
                </TabsContent>

                {/* Tab: Por subir */}
                <TabsContent value="porsubir" className="mt-6 animate-in fade-in-50">
                    <div className="p-12 border border-dashed border-[#333] rounded-xl bg-[#0a0a0a] text-center">
                        <p className="text-[#888] text-lg">
                            Aquí irán los videos por subir
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
