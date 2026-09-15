package com.sentinelx.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
public class RoleEntity {

    @Id
    @Column(length = 32)
    private String id;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<PermissionEntity> permissions = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public RoleEntity() {}

    public RoleEntity(String id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Set<PermissionEntity> getPermissions() { return permissions; }
    public void setPermissions(Set<PermissionEntity> permissions) { this.permissions = permissions; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
