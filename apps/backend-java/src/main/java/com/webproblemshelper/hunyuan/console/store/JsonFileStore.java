package com.webproblemshelper.hunyuan.console.store;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonFileStore<T> {
    private final ObjectMapper objectMapper;
    private final Path filePath;
    private final TypeReference<T> typeReference;
    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    public JsonFileStore(ObjectMapper objectMapper, Path filePath, TypeReference<T> typeReference) {
        this.objectMapper = objectMapper;
        this.filePath = filePath;
        this.typeReference = typeReference;
    }

    public T readOrDefault(T defaultValue) {
        lock.readLock().lock();
        try {
            if (!Files.exists(filePath)) {
                return defaultValue;
            }
            return objectMapper.readValue(filePath.toFile(), typeReference);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read file: " + filePath, e);
        } finally {
            lock.readLock().unlock();
        }
    }

    public void write(T value) {
        lock.writeLock().lock();
        try {
            Files.createDirectories(filePath.getParent());
            Path tmp = filePath.resolveSibling(filePath.getFileName() + ".tmp");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(tmp.toFile(), value);
            Files.move(tmp, filePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write file: " + filePath, e);
        } finally {
            lock.writeLock().unlock();
        }
    }
}
