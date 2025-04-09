#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include "DeviceManager.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    DeviceManager deviceManager;

    QQmlApplicationEngine engine;
    engine.rootContext()->setContextProperty("deviceManager", &deviceManager);

    const QUrl url(QStringLiteral("qrc:/main.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl) {
            qCritical() << "Failed to load QML file:" << url;
            QCoreApplication::exit(-1);
        }
    }, Qt::QueuedConnection);

    engine.load(url);

    return app.exec();
}
