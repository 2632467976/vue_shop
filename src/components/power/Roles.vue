<template>
  <div>
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card>
      <el-row>
        <el-col>
          <el-button type="primary">添加角色</el-button>
        </el-col>
      </el-row>

      <!-- 角色列表 -->
      <el-table :data="rolesList" stripe border>
        <el-table-column type="expand">
          <template slot-scope="scope">
            <!-- 一级权限 -->
            <el-row
              :key="item1.id"
              v-for="(item1, i1) in scope.row.children"
              :class="['bdbottom',i1===0?'bdtop':'','vcenter']"
            >
              <el-col :span="5">
                <el-tag closable @close="removeRightByID(scope.row,item1.id)">{{item1.authName}}</el-tag>
                <i class="el-icon-caret-right"></i>
              </el-col>
              <!-- 二级权限 -->
              <el-col :span="19">
                <el-row
                  :key="item2.id"
                  v-for="(item2, i2) in item1.children"
                  :class="[i2===0?'':'bdtop','vcenter']"
                >
                  <el-col :span="6">
                    <el-tag
                      type="success"
                      closable
                      @close="removeRightByID(scope.row,item2.id)"
                    >{{item2.authName}}</el-tag>
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <!-- 三权权限 -->
                  <el-col :span="18">
                    <el-tag
                      type="warning"
                      :key="item3.id"
                      v-for="item3 in item2.children"
                      closable
                      @close="removeRightByID(scope.row,item3.id)"
                    >{{item3.authName}}</el-tag>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column type="index"></el-table-column>
        <el-table-column label="角色名称" prop="roleName"></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
        <el-table-column label="操作" width="300px">
          <template slot-scope="scope">
            <el-button type="primart" icon="el-icon-edit" size="mini">编辑</el-button>
            <el-button type="danger" icon="el-icon-delete" size="mini">删除</el-button>
            <el-button
              type="warning"
              icon="el-icon-setting"
              size="mini"
              @click="setRightDialog(scope.row)"
            >分配权限</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 角色列表 end -->
    </el-card>

    <el-dialog
      title="分配权限"
      :visible.sync="setRightDialogVisible"
      @close="setRightDialogClose"
      width="50%"
    >
      <el-tree
        :data="rightsList"
        :props="treeProps"
        ref="treeRef"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="defKeys"
      ></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="setRightDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="allotRights">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      rolesList: [], // 角色列表
      rightsList: [], // 所有权限列表
      setRightDialogVisible: false, // 分配权限对话框的显示或隐藏
      treeProps: {
        label: 'authName',
        children: 'children'
      },
      defKeys: [], // 默认选中的权限
      roleId: [] // 当前选择的角色ID
    }
  },
  created () {
    this.getRolesList()
  },
  methods: {
    // 获取权限列表
    async getRolesList () {
      const { data: res } = await this.$http.get('roles')
      if (res.meta.status !== 200) {
        return this.$message.error(res.meta.msg)
      }
      this.rolesList = res.data
    },

    /**
     * 删除角色权限
     * role: 角色
     * rightID: 权限id
     */
    removeRightByID (role, rightID) {
      this.$confirm('此操作将删除该权限, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          const { data: res } = await this.$http.delete(
            `roles/${role.id}/rights/${rightID}`
          )
          if (res.meta.status !== 200) {
            return this.$message.error(res.meta.msg)
          }
          this.$message.success('删除成功!')
          role.children = res.data
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },

    // 分配权限 对话框
    async setRightDialog (role) {
      const { data: res } = await this.$http.get('rights/tree')
      if (res.meta.status !== 200) {
        return this.$message.error(res.meta.msg)
      }
      this.rightsList = res.data

      this.getLeafKeys(role, this.defKeys) // 获取三级节点的ID

      this.setRightDialogVisible = true

      this.roleId = role.id
    },

    // 分配权限 对话框 关闭事件
    setRightDialogClose () {
      this.defKeys = []
    },

    async allotRights () {
      const keys = [
        ...this.$refs.treeRef.getCheckedKeys(),
        ...this.$refs.treeRef.getHalfCheckedKeys()
      ]

      const idStr = keys.join(',')
      const { data: res } = await this.$http.post(
        `roles/${this.roleId}/rights`,
        { rids: idStr }
      )
      if (res.meta.status !== 200) {
        return this.$message.error(res.meta.msg)
      }

      this.$message.success(res.meta.msg)
      this.getRolesList()
      this.setRightDialogVisible = false
    },

    /**
     * 利用递归获取最后一级的id
     */
    getLeafKeys (node, arr) {
      if (!node.children) {
        // 最后一级节点肯定不包含 children 属性
        return arr.push(node.id)
      }
      // 不是最后一级，继续往下找
      node.children.forEach(item => {
        this.getLeafKeys(item, arr)
      })
    }
  }
}
</script>

<style lang="less" scoped>
.el-tag {
  margin: 7px;
}
.bdtop {
  border-top: 1px solid #eee;
}
.bdbottom {
  border-bottom: 1px solid #eee;
}
.vcenter {
  display: flex;
  align-items: center;
}
</style>
