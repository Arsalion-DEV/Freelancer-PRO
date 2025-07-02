import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/database/connection';
import { SocialPlatform } from '@/types';
import User from './User';

interface PlatformConnectionAttributes {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  permissions: string[];
  connectedAt: Date;
  lastSyncAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface PlatformConnectionCreationAttributes extends Optional<PlatformConnectionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PlatformConnection extends Model<PlatformConnectionAttributes, PlatformConnectionCreationAttributes> implements PlatformConnectionAttributes {
  public id!: string;
  public userId!: string;
  public platform!: SocialPlatform;
  public platformUserId!: string;
  public platformUsername!: string;
  public accessToken!: string;
  public refreshToken?: string;
  public tokenExpiresAt?: Date;
  public isActive!: boolean;
  public permissions!: string[];
  public connectedAt!: Date;
  public lastSyncAt?: Date;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance methods
  public isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return false;
    return new Date() > this.tokenExpiresAt;
  }

  public updateLastSync(): Promise<PlatformConnection> {
    this.lastSyncAt = new Date();
    return this.save();
  }

  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  // Static methods
  static async findByPlatform(platform: SocialPlatform): Promise<PlatformConnection[]> {
    return PlatformConnection.findAll({
      where: { platform, isActive: true }
    });
  }

  static async findUserConnections(userId: string): Promise<PlatformConnection[]> {
    return PlatformConnection.findAll({
      where: { userId, isActive: true },
      order: [['connectedAt', 'DESC']]
    });
  }

  static async findUserPlatformConnection(userId: string, platform: SocialPlatform): Promise<PlatformConnection | null> {
    return PlatformConnection.findOne({
      where: { userId, platform, isActive: true }
    });
  }
}

PlatformConnection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    platform: {
      type: DataTypes.ENUM(...Object.values(SocialPlatform)),
      allowNull: false,
    },
    platformUserId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    platformUsername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
    },
    connectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'PlatformConnection',
    tableName: 'platform_connections',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['platform'],
      },
      {
        fields: ['platformUserId'],
      },
      {
        unique: true,
        fields: ['userId', 'platform'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['connectedAt'],
      },
    ],
  }
);

// Define associations
PlatformConnection.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(PlatformConnection, {
  foreignKey: 'userId',
  as: 'platformConnections',
});

export default PlatformConnection;